package com.aprovati.apostila.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ApostilaDisciplinaCatalogoDTO {
    private Long id;
    private String disciplina;
    private List<ApostilaAssuntoCatalogoDTO> trilhas;
}
