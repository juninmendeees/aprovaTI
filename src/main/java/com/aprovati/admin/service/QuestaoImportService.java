package com.aprovati.admin.service;

import com.aprovati.admin.dto.*;
import com.aprovati.entity.Alternativa;
import com.aprovati.entity.Disciplina;
import com.aprovati.entity.Questao;
import com.aprovati.repository.QuestaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class QuestaoImportService {

    private final PdfTextExtractorService pdfTextExtractorService;
    private final CsvQuestaoExtractionService csvQuestaoExtractionService;
    private final OpenAiQuestaoExtractionService openAiQuestaoExtractionService;
    private final RuleBasedQuestaoExtractionService ruleBasedQuestaoExtractionService;
    private final DisciplinaMappingService disciplinaMappingService;
    private final QuestaoRepository questaoRepository;
    private final QuestaoDuplicateService questaoDuplicateService;

    @Value("${app.import.provider:rule-based}")
    private String importProvider;

    public ImportPreviewDTO gerarPreview(
            org.springframework.web.multipart.MultipartFile provaPdf,
            org.springframework.web.multipart.MultipartFile gabaritoPdf,
            String banca,
            Integer ano,
            String fonteProva
    ) {
        String provaText = pdfTextExtractorService.extractText(provaPdf);
        String gabaritoText = pdfTextExtractorService.extractText(gabaritoPdf);

        List<String> avisos = new ArrayList<>();
        List<ImportedQuestaoDTO> extracted;

        if ("openai".equalsIgnoreCase(importProvider)) {
            extracted = openAiQuestaoExtractionService.extractQuestoes(provaText, gabaritoText, banca, ano, fonteProva);
            avisos.add("Preview via OpenAI");
        } else {
            extracted = ruleBasedQuestaoExtractionService.extract(provaText, gabaritoText, banca, ano, fonteProva);
            avisos.add("Preview via regras locais (MVP gratuito)");
        }

        normalizeExtracted(extracted, banca, ano, fonteProva);
        markDuplicadas(extracted);

        Map<String, Long> counters = countByDisciplina(extracted);

        if (extracted.isEmpty()) {
            avisos.add("Nenhuma questão de TI extraída. Verifique a qualidade do PDF/gabarito.");
        }

        return ImportPreviewDTO.builder()
                .totalExtraidas(extracted.size())
                .porAssunto(counters)
                .avisos(avisos)
                .questoes(extracted)
                .build();
    }

    public ImportSummaryDTO confirmarImportacao(List<ImportedQuestaoDTO> reviewed) {
        return confirmarImportacao(reviewed, false);
    }

    public ImportSummaryDTO confirmarImportacao(List<ImportedQuestaoDTO> reviewed, boolean permitirDuplicadas) {
        List<ImportedQuestaoDTO> extracted = reviewed == null ? List.of() : reviewed;
        Map<String, Long> counters = new LinkedHashMap<>();
        List<String> avisos = new ArrayList<>();
        int total = 0;

        for (int i = 0; i < extracted.size(); i++) {
            ImportedQuestaoDTO item = extracted.get(i);
            try {
                Optional<Questao> duplicada = questaoDuplicateService.findDuplicateByEnunciado(item.getEnunciado());
                if (duplicada.isPresent() && !permitirDuplicadas) {
                    Questao existente = duplicada.get();
                    avisos.add("Questão duplicada no índice %d: já existe id %d - \"%s\""
                            .formatted(i, existente.getId(), existingPreview(existente.getEnunciado())));
                    continue;
                }
                Questao questao = mapToEntity(item, item.getBanca(), item.getAno(), item.getFonteProva());
                questaoRepository.save(questao);
                total++;
                String key = questao.getDisciplina().name();
                counters.put(key, counters.getOrDefault(key, 0L) + 1L);
            } catch (Exception ex) {
                avisos.add("Questão ignorada no índice %d: %s".formatted(i, ex.getMessage()));
            }
        }

        if (total == 0) {
            avisos.add("Nenhuma questão foi salva. Revise os dados antes de confirmar.");
        }

        return ImportSummaryDTO.builder()
                .totalImportadas(total)
                .porAssunto(counters)
                .avisos(avisos)
                .build();
    }

    public ImportSummaryDTO importar(
            org.springframework.web.multipart.MultipartFile provaPdf,
            org.springframework.web.multipart.MultipartFile gabaritoPdf,
            String banca,
            Integer ano,
            String fonteProva
    ) {
        ImportPreviewDTO preview = gerarPreview(provaPdf, gabaritoPdf, banca, ano, fonteProva);
        ImportSummaryDTO summary = confirmarImportacao(preview.getQuestoes(), false);
        List<String> mergedAvisos = new ArrayList<>(preview.getAvisos());
        if (summary.getAvisos() != null) {
            mergedAvisos.addAll(summary.getAvisos());
        }
        summary.setAvisos(mergedAvisos);
        return summary;
    }

    public ImportPreviewDTO gerarPreviewCsv(org.springframework.web.multipart.MultipartFile csvFile) {
        ImportPreviewDTO preview = csvQuestaoExtractionService.parseCsvPreview(csvFile);
        markDuplicadas(preview.getQuestoes());
        return preview;
    }

    public DuplicateCheckResult validarDuplicidade(ImportedQuestaoDTO questao) {
        Optional<Questao> duplicada = questaoDuplicateService.findDuplicateByEnunciado(questao == null ? null : questao.getEnunciado());
        return duplicada.map(value -> new DuplicateCheckResult(true, value.getId(), value.getEnunciado()))
                .orElseGet(() -> new DuplicateCheckResult(false, null, null));
    }

    public Questao salvarQuestaoManual(ImportedQuestaoDTO questao, boolean confirmarDuplicada) {
        ImportedQuestaoDTO item = questao == null ? new ImportedQuestaoDTO() : questao;
        normalizeExtracted(List.of(item), item.getBanca(), item.getAno(), item.getFonteProva());

        Optional<Questao> duplicada = questaoDuplicateService.findDuplicateByEnunciado(item.getEnunciado());
        if (duplicada.isPresent() && !confirmarDuplicada) {
            Questao existente = duplicada.get();
            throw new IllegalArgumentException("Questão duplicada: já existe id %d - \"%s\""
                    .formatted(existente.getId(), existingPreview(existente.getEnunciado())));
        }

        Questao entity = mapToEntity(item, item.getBanca(), item.getAno(), item.getFonteProva());
        return questaoRepository.save(entity);
    }

    private void markDuplicadas(List<ImportedQuestaoDTO> extracted) {
        if (extracted == null) {
            return;
        }
        for (ImportedQuestaoDTO item : extracted) {
            Optional<Questao> duplicada = questaoDuplicateService.findDuplicateByEnunciado(item.getEnunciado());
            if (duplicada.isPresent()) {
                Questao existente = duplicada.get();
                item.setDuplicada(true);
                item.setDuplicadaId(existente.getId());
                item.setDuplicadaEnunciado(existingPreview(existente.getEnunciado()));
            } else {
                item.setDuplicada(false);
                item.setDuplicadaId(null);
                item.setDuplicadaEnunciado(null);
            }
        }
    }

    private String existingPreview(String enunciado) {
        String text = safe(enunciado);
        if (text.length() <= 160) {
            return text;
        }
        return text.substring(0, 160) + "...";
    }

    private void normalizeExtracted(List<ImportedQuestaoDTO> extracted, String bancaDefault, Integer anoDefault, String fonteDefault) {
        for (ImportedQuestaoDTO item : extracted) {
            item.setEnunciado(safe(item.getEnunciado()));
            item.setBanca(nonBlankOrDefault(item.getBanca(), bancaDefault));
            item.setAno(item.getAno() != null ? item.getAno() : anoDefault);
            item.setFonteProva(nonBlankOrDefault(item.getFonteProva(), fonteDefault));
            item.setCargoFuncao(safe(item.getCargoFuncao()));
            Disciplina d = disciplinaMappingService.mapToDisciplina(item.getDisciplina(), item.getAssunto());
            item.setDisciplina(d.name());
            item.setAssunto(nonBlankOrDefault(item.getAssunto(), d.name()));
            item.setGabarito(safe(item.getGabarito()).toUpperCase(Locale.ROOT));
        }
    }

    private Map<String, Long> countByDisciplina(List<ImportedQuestaoDTO> extracted) {
        Map<String, Long> counters = new LinkedHashMap<>();
        for (ImportedQuestaoDTO item : extracted) {
            String key = safe(item.getDisciplina());
            if (key.isBlank()) {
                key = Disciplina.OUTRO.name();
            }
            counters.put(key, counters.getOrDefault(key, 0L) + 1L);
        }
        return counters;
    }

    private Questao mapToEntity(ImportedQuestaoDTO item, String bancaDefault, Integer anoDefault, String fonteDefault) {
        String enunciado = safe(item.getEnunciado());
        if (enunciado.isBlank()) {
            throw new IllegalArgumentException("enunciado vazio");
        }

        String gabarito = safe(item.getGabarito()).toUpperCase(Locale.ROOT);
        if (!Set.of("A", "B", "C", "D", "E").contains(gabarito)) {
            throw new IllegalArgumentException("gabarito inválido");
        }

        List<ImportedAlternativaDTO> alternativasIn = item.getAlternativas();
        if (alternativasIn == null || alternativasIn.isEmpty()) {
            throw new IllegalArgumentException("alternativas ausentes");
        }

        Disciplina disciplina = disciplinaMappingService.mapToDisciplina(item.getDisciplina(), item.getAssunto());

        Questao questao = Questao.builder()
                .enunciado(enunciado)
                .ano(item.getAno() != null ? item.getAno() : anoDefault)
                .banca(nonBlankOrDefault(item.getBanca(), bancaDefault))
                .disciplina(disciplina)
                .assunto(nonBlankOrDefault(item.getAssunto(), disciplina.name()))
                .cargoFuncao(safe(item.getCargoFuncao()))
                .gabarito(gabarito)
                .fonteProva(nonBlankOrDefault(item.getFonteProva(), fonteDefault))
                .build();

        List<Alternativa> alternativas = new ArrayList<>();
        for (ImportedAlternativaDTO alt : alternativasIn) {
            String letra = safe(alt.getLetra()).toUpperCase(Locale.ROOT);
            String texto = safe(alt.getTexto());
            if (letra.isBlank() || texto.isBlank()) {
                continue;
            }
            alternativas.add(Alternativa.builder()
                    .letra(letra)
                    .texto(texto)
                    .questao(questao)
                    .build());
        }

        if (alternativas.isEmpty()) {
            throw new IllegalArgumentException("alternativas inválidas");
        }

        questao.setAlternativas(alternativas);
        return questao;
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String nonBlankOrDefault(String value, String fallback) {
        String normalized = safe(value);
        if (!normalized.isBlank()) {
            return normalized;
        }
        return fallback;
    }

    public record DuplicateCheckResult(boolean duplicada, Long idQuestao, String enunciado) {
    }
}
