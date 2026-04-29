package com.aprovati.flashcard.repository;

import com.aprovati.flashcard.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    @Query("""
            select f from Flashcard f
            where (f.ownerUsuario is null or f.ownerUsuario.id = :usuarioId)
              and (:disciplina is null or upper(f.disciplina) = upper(:disciplina))
              and (
                :somentePadrao = false or f.ownerUsuario is null
              )
              and (
                :somentePessoal = false or f.ownerUsuario.id = :usuarioId
              )
            order by f.updatedAt desc
            """)
    List<Flashcard> listarVisiveis(
            @Param("usuarioId") Long usuarioId,
            @Param("disciplina") String disciplina,
            @Param("somentePadrao") boolean somentePadrao,
            @Param("somentePessoal") boolean somentePessoal
    );

    @Query("""
            select distinct f.disciplina from Flashcard f
            where f.ownerUsuario is null or f.ownerUsuario.id = :usuarioId
            order by f.disciplina asc
            """)
    List<String> listarDisciplinasVisiveis(@Param("usuarioId") Long usuarioId);

    @Query("""
            select f from Flashcard f
            where f.id = :flashcardId
              and (f.ownerUsuario is null or f.ownerUsuario.id = :usuarioId)
            """)
    Optional<Flashcard> buscarVisivel(@Param("flashcardId") Long flashcardId, @Param("usuarioId") Long usuarioId);

    @Query("""
            select f from Flashcard f
            where f.ownerUsuario is null
              and (:disciplina is null or upper(f.disciplina) = upper(:disciplina))
            order by f.updatedAt desc
            """)
    List<Flashcard> listarPadrao(@Param("disciplina") String disciplina);
}
