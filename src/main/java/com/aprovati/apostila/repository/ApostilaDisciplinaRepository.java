package com.aprovati.apostila.repository;

import com.aprovati.apostila.entity.ApostilaDisciplina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApostilaDisciplinaRepository extends JpaRepository<ApostilaDisciplina, Long> {
    Optional<ApostilaDisciplina> findByNomeIgnoreCase(String nome);
}
