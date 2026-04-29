package com.aprovati.mapamental.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "mapas_mentais")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapaMental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String disciplina;

    @Column(nullable = false, length = 160)
    private String assunto;

    @Column(nullable = false, length = 220)
    private String titulo;

    @Lob
    @Column(name = "imagem_bytes", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] imagemBytes;

    @Column(name = "imagem_content_type", nullable = false, length = 120)
    private String imagemContentType;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
