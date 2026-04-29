package com.aprovati.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DuplicateCheckResponseDTO {
    private boolean duplicada;
    private Long idQuestao;
    private String enunciado;
}
