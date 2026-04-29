package com.aprovati.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RespostaResponseDTO {

    private Long id;
    private String respostaMarcada;
    private Boolean correta;
    private String dataResposta;

    private Long usuarioId;
    private Long questaoId;
}