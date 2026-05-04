package com.aprovati.admin.dto;

import lombok.Data;

@Data
public class ManualQuestaoCreateRequestDTO {
    private ImportedQuestaoDTO questao;
    private boolean confirmarDuplicada;
    /** Base64 da imagem do enunciado (opcional). Apenas usado no cadastro manual. */
    private String imagemEnunciadoBase64;
}
