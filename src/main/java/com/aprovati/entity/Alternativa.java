package com.aprovati.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "alternativas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alternativa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String letra;

    @Column(columnDefinition = "TEXT")
    private String texto;

    @ManyToOne
    @JoinColumn(name = "questao_id")
    private Questao questao;
}