package com.aprovati.flashcard.entity;

import com.aprovati.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "flashcard_revisoes",
        uniqueConstraints = @UniqueConstraint(name = "uk_flashcard_revisao_usuario_card", columnNames = {"usuario_id", "flashcard_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardRevisao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Column(nullable = false)
    private Integer etapa;

    @Column(nullable = false)
    private Integer intervaloDias;

    @Column(nullable = false)
    private LocalDate proximaRevisao;

    private LocalDateTime ultimaRevisao;

    @Column(nullable = false)
    private Integer totalRevisoes;
}
