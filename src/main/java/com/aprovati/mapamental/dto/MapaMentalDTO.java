package com.aprovati.mapamental.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MapaMentalDTO {
    private Long id;
    private String disciplina;
    private String assunto;
    private String titulo;
    private String imagemDataUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
