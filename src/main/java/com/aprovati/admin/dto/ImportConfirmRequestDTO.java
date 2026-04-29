package com.aprovati.admin.dto;

import lombok.Data;

import java.util.List;

@Data
public class ImportConfirmRequestDTO {
    private List<ImportedQuestaoDTO> questoes;
    private boolean permitirDuplicadas;
}
