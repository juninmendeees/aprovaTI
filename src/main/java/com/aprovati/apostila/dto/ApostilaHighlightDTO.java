package com.aprovati.apostila.dto;

import lombok.Data;

import java.util.List;

@Data
public class ApostilaHighlightDTO {
    private String id;
    private String texto;
    private String cor;
    private String createdAt;
    private List<ApostilaHighlightAreaDTO> areas;
}
