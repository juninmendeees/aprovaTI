package com.aprovati.dto;

import lombok.Data;
import java.util.List;

@Data
public class QuestaoRequestDTO {

    private String enunciado;
    private Integer ano;
    private String banca;
    private String disciplina;
    private String assunto;
    private String cargoFuncao;
    private String gabarito;
    private String fonteProva;

    private List<AlternativaDTO> alternativas;
}