package com.aprovati.admin.service;

import com.aprovati.entity.Questao;
import com.aprovati.repository.QuestaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestaoDuplicateService {

    private final QuestaoRepository questaoRepository;

    public Optional<Questao> findDuplicateByEnunciado(String enunciado) {
        String normalized = enunciado == null ? "" : enunciado.trim();
        if (normalized.isBlank()) {
            return Optional.empty();
        }
        return questaoRepository.findFirstByEnunciadoNormalizado(normalized);
    }
}
