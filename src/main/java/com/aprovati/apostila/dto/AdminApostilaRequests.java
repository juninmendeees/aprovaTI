package com.aprovati.apostila.dto;

import lombok.Data;

public class AdminApostilaRequests {

    @Data
    public static class CreateDisciplinaRequest {
        private String nome;
    }

    @Data
    public static class CreateAssuntoRequest {
        private Long disciplinaId;
        private String nome;
    }

    @Data
    public static class CreateArquivoRequest {
        private Long assuntoId;
        private String titulo;
        private String url;
        private Integer paginas;
    }

    @Data
    public static class UpdateArquivoRequest {
        private String titulo;
        private String url;
        private Integer paginas;
    }
}
