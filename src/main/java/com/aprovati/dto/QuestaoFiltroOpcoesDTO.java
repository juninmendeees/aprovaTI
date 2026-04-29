package com.aprovati.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class QuestaoFiltroOpcoesDTO {
    private List<String> disciplinas;
    private List<String> bancas;
}
