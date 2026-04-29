package com.aprovati.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ImportSummaryDTO {
    private int totalImportadas;
    private Map<String, Long> porAssunto;
    private List<String> avisos;
}
