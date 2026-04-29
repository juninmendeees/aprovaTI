package com.aprovati.admin.service;

import com.aprovati.admin.dto.ImportedAlternativaDTO;
import com.aprovati.admin.dto.ImportedQuestaoDTO;
import com.aprovati.entity.Disciplina;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class RuleBasedQuestaoExtractionService {

    private static final Pattern QUESTAO_START = Pattern.compile("(?m)^\\s*(\\d{1,3})\\s*[)\\.-]\\s+");
    private static final Pattern ALT_SPLIT = Pattern.compile("(?m)\\n\\s*([A-E])\\s*[)\\.-]\\s+");
    private static final Pattern GABARITO = Pattern.compile("(?im)^\\s*(\\d{1,3})\\s*[-:)\\.]\\s*([A-E])\\s*$");

    private static final List<String> TI_KEYWORDS = List.of(
            "informatica", "tecnologia da informacao", "ti", "software", "hardware",
            "programacao", "algoritmo", "banco de dados", "rede", "sistema",
            "seguranca", "devops", "api", "linux", "web", "mobile", "cloud"
    );

    private final DisciplinaMappingService disciplinaMappingService;

    public List<ImportedQuestaoDTO> extract(String provaText, String gabaritoText, String banca, Integer ano, String fonteProva) {
        Map<Integer, String> answers = parseGabarito(gabaritoText);
        List<QuestaoChunk> chunks = splitQuestoes(provaText);
        List<ImportedQuestaoDTO> out = new ArrayList<>();

        for (QuestaoChunk chunk : chunks) {
            if (!isLikelyTi(chunk.body)) {
                continue;
            }
            ParsedAlternativas parsed = parseAlternativas(chunk.body);
            if (parsed.alternativas.isEmpty()) {
                continue;
            }

            String answer = answers.getOrDefault(chunk.number, "").toUpperCase(Locale.ROOT);
            if (!Set.of("A", "B", "C", "D", "E").contains(answer)) {
                continue;
            }

            Disciplina disciplina = disciplinaMappingService.mapToDisciplina(parsed.enunciado, parsed.enunciado);
            ImportedQuestaoDTO dto = new ImportedQuestaoDTO();
            dto.setEnunciado(parsed.enunciado);
            dto.setAno(ano);
            dto.setBanca(banca);
            dto.setFonteProva(fonteProva);
            dto.setDisciplina(disciplina.name());
            dto.setAssunto(disciplina.name());
            dto.setGabarito(answer);
            dto.setAlternativas(parsed.alternativas);
            out.add(dto);
        }

        return out;
    }

    private Map<Integer, String> parseGabarito(String text) {
        Map<Integer, String> map = new HashMap<>();
        Matcher m = GABARITO.matcher(text == null ? "" : text);
        while (m.find()) {
            int q = Integer.parseInt(m.group(1));
            String a = m.group(2).toUpperCase(Locale.ROOT);
            map.put(q, a);
        }
        return map;
    }

    private List<QuestaoChunk> splitQuestoes(String text) {
        List<QuestaoChunk> list = new ArrayList<>();
        String src = text == null ? "" : text;
        Matcher m = QUESTAO_START.matcher(src);

        List<Integer> starts = new ArrayList<>();
        List<Integer> numbers = new ArrayList<>();
        while (m.find()) {
            starts.add(m.start());
            numbers.add(Integer.parseInt(m.group(1)));
        }
        for (int i = 0; i < starts.size(); i++) {
            int start = starts.get(i);
            int end = i + 1 < starts.size() ? starts.get(i + 1) : src.length();
            String body = src.substring(start, end).trim();
            list.add(new QuestaoChunk(numbers.get(i), body));
        }
        return list;
    }

    private ParsedAlternativas parseAlternativas(String block) {
        ParsedAlternativas out = new ParsedAlternativas();
        Matcher m = ALT_SPLIT.matcher("\n" + block);

        List<Integer> starts = new ArrayList<>();
        List<String> letters = new ArrayList<>();
        while (m.find()) {
            starts.add(m.start());
            letters.add(m.group(1).toUpperCase(Locale.ROOT));
        }

        if (starts.isEmpty()) {
            out.enunciado = clean(block);
            return out;
        }

        String all = "\n" + block;
        out.enunciado = clean(all.substring(0, starts.get(0)));

        for (int i = 0; i < starts.size(); i++) {
            int start = starts.get(i);
            int end = i + 1 < starts.size() ? starts.get(i + 1) : all.length();
            String raw = all.substring(start, end);
            String letter = letters.get(i);
            String txt = clean(raw.replaceFirst("(?is)^\\s*[A-E]\\s*[)\\.-]\\s+", ""));
            if (!txt.isBlank()) {
                ImportedAlternativaDTO a = new ImportedAlternativaDTO();
                a.setLetra(letter);
                a.setTexto(txt);
                out.alternativas.add(a);
            }
        }

        return out;
    }

    private boolean isLikelyTi(String text) {
        String n = normalize(text);
        for (String k : TI_KEYWORDS) {
            if (n.contains(normalize(k))) return true;
        }
        Disciplina mapped = disciplinaMappingService.mapToDisciplina(text, text);
        return mapped != Disciplina.OUTRO;
    }

    private String clean(String s) {
        return (s == null ? "" : s).replaceAll("\\s+", " ").trim();
    }

    private String normalize(String s) {
        return (s == null ? "" : s).toLowerCase(Locale.ROOT);
    }

    private static class QuestaoChunk {
        final int number;
        final String body;

        QuestaoChunk(int number, String body) {
            this.number = number;
            this.body = body;
        }
    }

    private static class ParsedAlternativas {
        String enunciado = "";
        List<ImportedAlternativaDTO> alternativas = new ArrayList<>();
    }
}
