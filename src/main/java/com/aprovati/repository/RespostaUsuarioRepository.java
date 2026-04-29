package com.aprovati.repository;

import com.aprovati.entity.RespostaUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RespostaUsuarioRepository extends JpaRepository<RespostaUsuario, Long> {

    List<RespostaUsuario> findByUsuarioId(Long usuarioId);

    long countByUsuarioIdAndDataRespostaBetween(Long usuarioId, LocalDateTime start, LocalDateTime end);
}
