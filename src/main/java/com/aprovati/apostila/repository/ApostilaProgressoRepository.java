package com.aprovati.apostila.repository;

import com.aprovati.apostila.entity.ApostilaProgresso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApostilaProgressoRepository extends JpaRepository<ApostilaProgresso, Long> {
    List<ApostilaProgresso> findByUsuarioId(Long usuarioId);

    Optional<ApostilaProgresso> findByUsuarioIdAndPdfId(Long usuarioId, String pdfId);
}
