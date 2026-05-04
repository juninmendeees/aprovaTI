package com.aprovati.mapper;

import com.aprovati.dto.*;
import com.aprovati.entity.*;

import java.util.stream.Collectors;

public class QuestaoMapper {

    public static Questao toEntity(QuestaoRequestDTO dto) {

        Questao questao = Questao.builder()
                .enunciado(dto.getEnunciado())
                .ano(dto.getAno())
                .banca(dto.getBanca())
                .disciplina(Disciplina.valueOf(dto.getDisciplina()))
                .assunto(dto.getAssunto())
                .cargoFuncao(dto.getCargoFuncao())
                .gabarito(dto.getGabarito())
                .fonteProva(dto.getFonteProva())
                .build();

        questao.setAlternativas(
                dto.getAlternativas().stream().map(a -> Alternativa.builder()
                        .letra(a.getLetra())
                        .texto(a.getTexto())
                        .questao(questao)
                        .build()
                ).collect(Collectors.toList())
        );

        return questao;
    }

    public static QuestaoResponseDTO toDTO(Questao questao) {

        return QuestaoResponseDTO.builder()
                .id(questao.getId())
                .enunciado(questao.getEnunciado())
                .ano(questao.getAno())
                .banca(questao.getBanca())
                .disciplina(questao.getDisciplina().name())
                .assunto(questao.getAssunto())
                .cargoFuncao(questao.getCargoFuncao())
                .gabarito(questao.getGabarito())
                .temImagemEnunciado(
                        questao.getEnunciadoImagemExt() != null && !questao.getEnunciadoImagemExt().isBlank()
                )
                .alternativas(
                        questao.getAlternativas().stream().map(a -> {
                            AlternativaDTO dto = new AlternativaDTO();
                            dto.setLetra(a.getLetra());
                            dto.setTexto(a.getTexto());
                            return dto;
                        }).collect(Collectors.toList())
                )
                .build();
    }
}