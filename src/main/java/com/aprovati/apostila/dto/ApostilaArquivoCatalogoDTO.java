package com.aprovati.apostila.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApostilaArquivoCatalogoDTO {
    private Long id;
    private String titulo;
    private String url;
    private Integer paginas;
}
