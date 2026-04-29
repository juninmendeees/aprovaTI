package com.aprovati.specification;

import com.aprovati.entity.Disciplina;
import com.aprovati.entity.Questao;
import org.springframework.data.jpa.domain.Specification;

import java.util.Arrays;

public class QuestaoSpecification {

    public static Specification<Questao> disciplinaEquals(String disciplina) {
        return (root, query, cb) -> {
            if (disciplina == null) {
                return null;
            }
            Disciplina d = Arrays.stream(Disciplina.values())
                    .filter(v -> v.name().equalsIgnoreCase(disciplina.trim()))
                    .findFirst()
                    .orElse(null);
            return d == null ? cb.disjunction() : cb.equal(root.get("disciplina"), d);
        };
    }

    public static Specification<Questao> anoEquals(Integer ano) {
        return (root, query, cb) ->
                ano == null ? null :
                        cb.equal(root.get("ano"), ano);
    }

    public static Specification<Questao> bancaEquals(String banca) {
        return (root, query, cb) ->
                banca == null ? null :
                        cb.equal(cb.lower(root.get("banca")), banca.toLowerCase());
    }

    public static Specification<Questao> assuntoContains(String assunto) {
        return (root, query, cb) ->
                assunto == null || assunto.isBlank() ? null :
                        cb.like(cb.lower(root.get("assunto")), "%" + assunto.toLowerCase().trim() + "%");
    }

    public static Specification<Questao> idEquals(Long questaoId) {
        return (root, query, cb) ->
                questaoId == null ? null :
                        cb.equal(root.get("id"), questaoId);
    }

    public static Specification<Questao> cargoFuncaoContains(String cargoFuncao) {
        return (root, query, cb) ->
                cargoFuncao == null || cargoFuncao.isBlank() ? null :
                        cb.like(cb.lower(root.get("cargoFuncao")), "%" + cargoFuncao.toLowerCase().trim() + "%");
    }
}