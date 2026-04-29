package com.aprovati.flashcard.entity;

import com.aprovati.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "flashcards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String disciplina;

    @Column(nullable = false, length = 400)
    private String frente;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String verso;

    @Lob
    @Column(name = "imagem_bytes", columnDefinition = "LONGBLOB")
    private byte[] imagemBytes;

    @Column(name = "imagem_content_type", length = 120)
    private String imagemContentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_usuario_id")
    private Usuario ownerUsuario;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
