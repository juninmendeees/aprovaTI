package com.aprovati.apostila.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "apostila_assuntos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApostilaAssunto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @ManyToOne(optional = false)
    @JoinColumn(name = "disciplina_id", nullable = false)
    private ApostilaDisciplina disciplina;

    @OneToMany(mappedBy = "assunto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ApostilaArquivo> arquivos = new ArrayList<>();
}
