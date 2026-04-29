package com.aprovati.apostila.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "apostila_arquivos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApostilaArquivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "storage_path")
    private String storagePath;

    private Integer paginas;

    @ManyToOne(optional = false)
    @JoinColumn(name = "assunto_id", nullable = false)
    private ApostilaAssunto assunto;
}
