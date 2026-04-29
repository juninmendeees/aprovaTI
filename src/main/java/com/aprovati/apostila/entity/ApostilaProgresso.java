package com.aprovati.apostila.entity;

import com.aprovati.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "apostila_progresso", uniqueConstraints = {
        @UniqueConstraint(name = "uk_apostila_usuario_pdf", columnNames = {"usuario_id", "pdf_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApostilaProgresso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "pdf_id", nullable = false)
    private String pdfId;

    @Column(nullable = false)
    private Boolean concluido;

    @Column(columnDefinition = "TEXT")
    private String anotacoes;

    @Column(columnDefinition = "LONGTEXT")
    private String grifosJson;

    @Column(name = "ultima_pagina")
    private Integer ultimaPagina;

    @Column(nullable = false)
    private LocalDateTime atualizadoEm;
}
