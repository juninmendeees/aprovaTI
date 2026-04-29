package com.aprovati.repository;

import com.aprovati.entity.Questao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuestaoRepository extends JpaRepository<Questao, Long>,
        JpaSpecificationExecutor<Questao> {

    @Query("""
            SELECT q FROM Questao q
            WHERE q.id NOT IN (
                SELECT r.questao.id FROM RespostaUsuario r
                WHERE r.usuario.id = :usuarioId
            )
            """)
    List<Questao> findNaoRespondidas(@Param("usuarioId") Long usuarioId);

    @Query("""
            SELECT DISTINCT q FROM Questao q
            JOIN RespostaUsuario r ON r.questao.id = q.id
            WHERE r.usuario.id = :usuarioId
              AND r.correta = false
            """)
    List<Questao> findSomenteErrei(@Param("usuarioId") Long usuarioId);

    @Query("""
            SELECT DISTINCT q.disciplina FROM Questao q
            WHERE q.disciplina IS NOT NULL
            ORDER BY q.disciplina
            """)
    List<com.aprovati.entity.Disciplina> findDistinctDisciplinas();

    @Query("""
            SELECT DISTINCT q.banca FROM Questao q
            WHERE q.banca IS NOT NULL AND TRIM(q.banca) <> ''
            ORDER BY q.banca
            """)
    List<String> findDistinctBancas();

    @Query("""
            SELECT q FROM Questao q
            WHERE LOWER(TRIM(q.enunciado)) = LOWER(TRIM(:enunciado))
            ORDER BY q.id
            """)
    Optional<Questao> findFirstByEnunciadoNormalizado(@Param("enunciado") String enunciado);
}
