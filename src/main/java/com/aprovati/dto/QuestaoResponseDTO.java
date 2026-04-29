package com.aprovati.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuestaoResponseDTO {

    private Long id;
    private String enunciado;
    private Integer ano;
    private String banca;
    private String disciplina;
    private String assunto;
    private String cargoFuncao;
    private String gabarito;

    private List<AlternativaDTO> alternativas;
}