package com.aprovati.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "questoes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Questao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String enunciado;

    private Integer ano;

    private String banca;

    @Enumerated(EnumType.STRING)
    private Disciplina disciplina;

    private String assunto;

    private String cargoFuncao;

    private String gabarito;

    private String fonteProva;

    /** Extensão do arquivo de imagem do enunciado (ex.: png), apenas para questões cadastradas manualmente com imagem. */
    @Column(name = "enunciado_imagem_ext", length = 8)
    private String enunciadoImagemExt;

    @OneToMany(mappedBy = "questao", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Alternativa> alternativas;
}