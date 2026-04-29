package com.aprovati.flashcard.repository;

import com.aprovati.flashcard.entity.FlashcardRevisao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FlashcardRevisaoRepository extends JpaRepository<FlashcardRevisao, Long> {

    Optional<FlashcardRevisao> findByUsuarioIdAndFlashcardId(Long usuarioId, Long flashcardId);

    @Query("""
            select r from FlashcardRevisao r
            where r.usuario.id = :usuarioId
              and r.flashcard.id in :flashcardIds
            """)
    List<FlashcardRevisao> listarPorUsuarioEFlashcards(
            @Param("usuarioId") Long usuarioId,
            @Param("flashcardIds") Collection<Long> flashcardIds
    );
}
