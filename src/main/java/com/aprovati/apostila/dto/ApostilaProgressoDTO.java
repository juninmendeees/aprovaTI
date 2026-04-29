package com.aprovati.apostila.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ApostilaProgressoDTO {
    private String pdfId;
    private Boolean concluido;
    private String anotacoes;
    private List<ApostilaHighlightDTO> grifos;
    private Integer ultimaPagina;
}
