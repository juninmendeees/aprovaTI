package com.aprovati.admin.service;

import com.aprovati.admin.dto.ImportedQuestaoDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenAiQuestaoExtractionService {
    private static final int MAX_PROVA_CHARS = 120_000;
    private static final int MAX_GABARITO_CHARS = 40_000;

    private final ObjectMapper objectMapper;

    @Value("${app.openai.api-key:}")
    private String apiKey;

    @Value("${app.openai.model:gpt-4.1-mini}")
    private String model;

    public List<ImportedQuestaoDTO> extractQuestoes(String provaText, String gabaritoText, String banca, Integer ano, String fonteProva) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OPENAI_API_KEY não configurada");
        }

        String prompt = buildPrompt(
                truncate(provaText, MAX_PROVA_CHARS),
                truncate(gabaritoText, MAX_GABARITO_CHARS),
                banca,
                ano,
                fonteProva
        );
        String completion = callOpenAi(prompt);
        String json = sanitizeJson(completion);

        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Resposta da OpenAI inválida para JSON de questões", e);
        }
    }

    private String callOpenAi(String prompt) {
        HttpClient client = HttpClient.newHttpClient();
        Map<String, Object> payload = Map.of(
                "model", model,
                "temperature", 0.1,
                "messages", List.of(
                        Map.of("role", "system", "content", "Você extrai questões de concursos de TI para JSON estrito."),
                        Map.of("role", "user", "content", prompt)
                )
        );

        try {
            String requestBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                String details = extractErrorDetails(response.body());
                log.error("OpenAI HTTP {}: {}", response.statusCode(), details);
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Falha ao consultar OpenAI: HTTP " + response.statusCode() + " - " + details);
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI retornou conteúdo vazio");
            }
            return contentNode.asText();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erro ao processar chamada OpenAI", e);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Erro ao processar chamada OpenAI", e);
        }
    }

    private String extractErrorDetails(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode msg = root.path("error").path("message");
            if (!msg.isMissingNode() && !msg.asText().isBlank()) {
                return msg.asText();
            }
        } catch (Exception ignored) {
            // fallback para texto bruto
        }
        return body == null ? "sem detalhes" : body.substring(0, Math.min(body.length(), 500));
    }

    private String sanitizeJson(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```json", "")
                    .replaceFirst("^```", "")
                    .replaceFirst("```$", "")
                    .trim();
        }
        return trimmed;
    }

    private String buildPrompt(String provaText, String gabaritoText, String banca, Integer ano, String fonteProva) {
        return """
                Extraia APENAS questões de informática/TI da prova abaixo e aplique o gabarito oficial.
                Retorne SOMENTE JSON (array), sem markdown.

                Formato de cada item:
                {
                  \"enunciado\": string,
                  \"ano\": number|null,
                  \"banca\": string|null,
                  \"disciplina\": string,
                  \"assunto\": string,
                  \"gabarito\": \"A\"|\"B\"|\"C\"|\"D\"|\"E\",
                  \"fonteProva\": string|null,
                  \"alternativas\": [
                    {\"letra\":\"A\",\"texto\":string},
                    {\"letra\":\"B\",\"texto\":string},
                    {\"letra\":\"C\",\"texto\":string},
                    {\"letra\":\"D\",\"texto\":string},
                    {\"letra\":\"E\",\"texto\":string}
                  ]
                }

                Regras:
                - incluir apenas questões de TI/informática/tecnologia da informação e sinônimos.
                - disciplina deve ser uma das categorias:
                  ENGENHARIA_DE_SOFTWARE, METODOLOGIA_DE_DESENVOLVIMENTO_DE_SOFTWARE, DEVOPS_E_DEVSECOPS,
                  ORIENTACAO_A_OBJETOS, GERENCIA_DE_PROJETOS_SERVICOS_E_GOVERNANCA_DE_TI, PROGRAMACAO,
                  DESENVOLVIMENTO_WEB_E_MOBILE, DESENVOLVIMENTO_DE_SOFTWARE_SEGURO, INTELIGENCIA_ARTIFICIAL,
                  BANCO_DE_DADOS, NOCOES_DE_INFRAESTRUTURA, ARQUITETURAS, SEGURANCA_DE_REDES, REDES,
                  SEGURANCA_DA_INFORMACAO, OUTRO.
                - use metadados abaixo como default quando não explícitos.

                METADADOS DEFAULT:
                banca=%s
                ano=%s
                fonteProva=%s

                TEXTO DA PROVA:
                %s

                TEXTO DO GABARITO:
                %s
                """.formatted(
                banca == null ? "" : banca,
                ano == null ? "" : ano,
                fonteProva == null ? "" : fonteProva,
                provaText,
                gabaritoText
        );
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max);
    }
}
