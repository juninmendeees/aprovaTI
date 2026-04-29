package com.aprovati.admin.dto;

import lombok.Data;

import java.util.List;

@Data
public class ImportedQuestaoDTO {
    private String enunciado;
    private Integer ano;
    private String banca;
    private String disciplina;
    private String assunto;
    private String cargoFuncao;
    private String gabarito;
    private String fonteProva;
    private Boolean duplicada;
    private Long duplicadaId;
    private String duplicadaEnunciado;
    private List<ImportedAlternativaDTO> alternativas;
}
