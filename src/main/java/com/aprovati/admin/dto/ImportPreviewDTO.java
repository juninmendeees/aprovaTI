package com.aprovati.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ImportPreviewDTO {
    private int totalExtraidas;
    private Map<String, Long> porAssunto;
    private List<String> avisos;
    private List<ImportedQuestaoDTO> questoes;
}
