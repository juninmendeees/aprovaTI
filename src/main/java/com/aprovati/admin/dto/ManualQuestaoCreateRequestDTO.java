package com.aprovati.admin.dto;

import lombok.Data;

@Data
public class ManualQuestaoCreateRequestDTO {
    private ImportedQuestaoDTO questao;
    private boolean confirmarDuplicada;
}
