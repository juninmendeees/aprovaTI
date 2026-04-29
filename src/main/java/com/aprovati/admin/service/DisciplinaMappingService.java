package com.aprovati.admin.service;

import com.aprovati.entity.Disciplina;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
public class DisciplinaMappingService {

    public Disciplina mapToDisciplina(String rawDisciplina, String rawAssunto) {
        String normalized = normalize(rawDisciplina + " " + rawAssunto);

        if (contains(normalized, "engenharia de software")) return Disciplina.ENGENHARIA_DE_SOFTWARE;
        if (contains(normalized, "metodologia", "desenvolvimento de software")) return Disciplina.METODOLOGIA_DE_DESENVOLVIMENTO_DE_SOFTWARE;
        if (contains(normalized, "devops", "devsecops", "ci/cd")) return Disciplina.DEVOPS_E_DEVSECOPS;
        if (contains(normalized, "orientacao a objetos", "poo")) return Disciplina.ORIENTACAO_A_OBJETOS;
        if (contains(normalized, "gerencia", "governanca", "itil", "cobit", "servicos")) return Disciplina.GERENCIA_DE_PROJETOS_SERVICOS_E_GOVERNANCA_DE_TI;
        if (contains(normalized, "programacao", "algoritmo", "logica")) return Disciplina.PROGRAMACAO;
        if (contains(normalized, "web", "mobile", "frontend", "backend", "api")) return Disciplina.DESENVOLVIMENTO_WEB_E_MOBILE;
        if (contains(normalized, "software seguro", "secure coding", "owasp", "vulnerabilidade")) return Disciplina.DESENVOLVIMENTO_DE_SOFTWARE_SEGURO;
        if (contains(normalized, "inteligencia artificial", "machine learning", "ia")) return Disciplina.INTELIGENCIA_ARTIFICIAL;
        if (contains(normalized, "banco de dados", "sql", "normalizacao", "transacao")) return Disciplina.BANCO_DE_DADOS;
        if (contains(normalized, "infraestrutura", "linux", "servidor", "cloud")) return Disciplina.NOCOES_DE_INFRAESTRUTURA;
        if (contains(normalized, "arquitetura", "microservicos", "monolito", "soa")) return Disciplina.ARQUITETURAS;
        if (contains(normalized, "seguranca de redes", "firewall", "ids", "ips")) return Disciplina.SEGURANCA_DE_REDES;
        if (contains(normalized, "redes", "tcp", "ip", "osi")) return Disciplina.REDES;
        if (contains(normalized, "seguranca da informacao", "criptografia", "lgpd")) return Disciplina.SEGURANCA_DA_INFORMACAO;

        return Disciplina.OUTRO;
    }

    private boolean contains(String text, String... candidates) {
        for (String candidate : candidates) {
            if (text.contains(normalize(candidate))) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String text) {
        if (text == null) return "";
        String n = Normalizer.normalize(text, Normalizer.Form.NFD);
        n = n.replaceAll("\\p{M}", "");
        return n.toLowerCase(Locale.ROOT);
    }
}
