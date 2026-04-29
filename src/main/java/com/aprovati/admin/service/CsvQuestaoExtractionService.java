package com.aprovati.admin.service;

import com.aprovati.admin.dto.ImportPreviewDTO;
import com.aprovati.admin.dto.ImportedAlternativaDTO;
import com.aprovati.admin.dto.ImportedQuestaoDTO;
import com.aprovati.entity.Disciplina;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CsvQuestaoExtractionService {

    private final DisciplinaMappingService disciplinaMappingService;

    public ImportPreviewDTO parseCsvPreview(MultipartFile csvFile) {
        List<String> avisos = new ArrayList<>();
        List<ImportedQuestaoDTO> questoes = new ArrayList<>();

        try (Reader reader = new InputStreamReader(csvFile.getInputStream(), StandardCharsets.UTF_8)) {
            String content = readAll(reader);
            boolean normalizedWrappedLines = false;
            if (looksLikeWrappedCsv(content)) {
                content = normalizeWrappedLines(content);
                normalizedWrappedLines = true;
            }

            parseRecords(new StringReader(content), questoes, avisos);

            if (questoes.isEmpty()) {
                avisos.add("Nenhuma linha válida encontrada no CSV.");
            } else {
                avisos.add("Preview via CSV padronizado");
                if (normalizedWrappedLines) {
                    avisos.add("Arquivo normalizado automaticamente: linhas estavam encapsuladas por aspas.");
                }
            }

            Map<String, Long> porAssunto = new LinkedHashMap<>();
            for (ImportedQuestaoDTO q : questoes) {
                porAssunto.put(q.getDisciplina(), porAssunto.getOrDefault(q.getDisciplina(), 0L) + 1);
            }

            return ImportPreviewDTO.builder()
                    .totalExtraidas(questoes.size())
                    .porAssunto(porAssunto)
                    .avisos(avisos)
                    .questoes(questoes)
                    .build();

        } catch (Exception e) {
            throw new IllegalArgumentException("Falha ao ler CSV: " + e.getMessage(), e);
        }
    }

    private void parseRecords(Reader reader, List<ImportedQuestaoDTO> questoes, List<String> avisos) throws Exception {
        try (CSVParser parser = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .build()
                .parse(reader)) {

            long line = 1;
            for (CSVRecord record : parser) {
                line++;
                try {
                    ImportedQuestaoDTO dto = mapRecord(record);
                    if (dto != null) {
                        questoes.add(dto);
                    }
                } catch (Exception ex) {
                    avisos.add("Linha %d ignorada: %s".formatted(line, ex.getMessage()));
                }
            }
        }
    }

    private String readAll(Reader reader) throws Exception {
        StringBuilder sb = new StringBuilder();
        char[] buffer = new char[4096];
        int n;
        while ((n = reader.read(buffer)) != -1) {
            sb.append(buffer, 0, n);
        }
        return sb.toString();
    }

    private boolean looksLikeWrappedCsv(String content) {
        String[] lines = content.split("\\R");
        for (String raw : lines) {
            String line = raw == null ? "" : raw.trim();
            if (line.isEmpty()) {
                continue;
            }
            return line.length() >= 2 && line.startsWith("\"") && line.endsWith("\"");
        }
        return false;
    }

    private String normalizeWrappedLines(String content) {
        String[] lines = content.split("\\R", -1);
        StringBuilder out = new StringBuilder(content.length());
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String normalized = line;
            if (line != null) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() >= 2) {
                    int first = line.indexOf('"');
                    int last = line.lastIndexOf('"');
                    if (first >= 0 && last > first) {
                        normalized = line.substring(0, first)
                                + line.substring(first + 1, last).replace("\"\"", "\"")
                                + line.substring(last + 1);
                    }
                }
            }
            out.append(normalized);
            if (i < lines.length - 1) {
                out.append('\n');
            }
        }
        return out.toString();
    }

    private ImportedQuestaoDTO mapRecord(CSVRecord r) {
        String enunciado = req(r, "enunciado");
        String gabarito = req(r, "gabarito").toUpperCase(Locale.ROOT);
        if (!Set.of("A", "B", "C", "D", "E").contains(gabarito)) {
            throw new IllegalArgumentException("gabarito deve ser A/B/C/D/E");
        }

        String disciplinaRaw = opt(r, "disciplina");
        String assunto = opt(r, "assunto");
        Disciplina disciplina = disciplinaMappingService.mapToDisciplina(disciplinaRaw, assunto);

        ImportedQuestaoDTO dto = new ImportedQuestaoDTO();
        dto.setEnunciado(enunciado);
        dto.setDisciplina(disciplina.name());
        dto.setAssunto(assunto.isBlank() ? disciplina.name() : assunto);
        dto.setBanca(opt(r, "banca"));
        dto.setFonteProva(opt(r, "fonte_prova"));
        dto.setCargoFuncao(firstNonBlank(
                opt(r, "cargo_funcao"),
                opt(r, "cargo"),
                opt(r, "funcao")
        ));
        dto.setAno(parseIntOrNull(opt(r, "ano")));
        dto.setGabarito(gabarito);

        List<ImportedAlternativaDTO> alts = new ArrayList<>();
        alts.add(alt("A", req(r, "alternativa_a")));
        alts.add(alt("B", req(r, "alternativa_b")));
        alts.add(alt("C", req(r, "alternativa_c")));
        alts.add(alt("D", req(r, "alternativa_d")));
        alts.add(alt("E", req(r, "alternativa_e")));
        dto.setAlternativas(alts);

        return dto;
    }

    private ImportedAlternativaDTO alt(String letra, String texto) {
        ImportedAlternativaDTO a = new ImportedAlternativaDTO();
        a.setLetra(letra);
        a.setTexto(texto);
        return a;
    }

    private String req(CSVRecord r, String col) {
        String v = opt(r, col);
        if (v.isBlank()) {
            throw new IllegalArgumentException("coluna obrigatória ausente: " + col);
        }
        return v;
    }

    private String opt(CSVRecord r, String col) {
        if (!r.isMapped(col)) return "";
        String v = r.get(col);
        return v == null ? "" : v.trim();
    }

    private Integer parseIntOrNull(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return Integer.parseInt(v.trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
