package com.aprovati.apostila.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ApostilaAssuntoCatalogoDTO {
    private Long id;
    private String assunto;
    private List<ApostilaArquivoCatalogoDTO> arquivos;
}
