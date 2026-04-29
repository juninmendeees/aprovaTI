package com.aprovati.apostila.service;

import com.aprovati.apostila.dto.ApostilaHighlightDTO;
import com.aprovati.apostila.dto.ApostilaProgressoDTO;
import com.aprovati.apostila.entity.ApostilaProgresso;
import com.aprovati.apostila.repository.ApostilaProgressoRepository;
import com.aprovati.entity.Usuario;
import com.aprovati.security.AuthenticatedUserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApostilaProgressoService {

    private final ApostilaProgressoRepository apostilaProgressoRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final ObjectMapper objectMapper;

    public List<ApostilaProgressoDTO> listarDoUsuarioAtual() {
        Usuario usuario = authenticatedUserService.getCurrentUsuario();
        return apostilaProgressoRepository.findByUsuarioId(usuario.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    public ApostilaProgressoDTO salvarDoUsuarioAtual(String pdfId, ApostilaProgressoDTO input) {
        Usuario usuario = authenticatedUserService.getCurrentUsuario();
        ApostilaProgresso progresso = apostilaProgressoRepository
                .findByUsuarioIdAndPdfId(usuario.getId(), pdfId)
                .orElseGet(() -> ApostilaProgresso.builder()
                        .usuario(usuario)
                        .pdfId(pdfId)
                        .concluido(false)
                        .anotacoes("")
                        .grifosJson("[]")
                        .ultimaPagina(null)
                        .atualizadoEm(LocalDateTime.now())
                        .build());

        progresso.setConcluido(input.getConcluido() != null ? input.getConcluido() : Boolean.FALSE);
        progresso.setAnotacoes(input.getAnotacoes() == null ? "" : input.getAnotacoes());
        progresso.setGrifosJson(writeGrifos(input.getGrifos()));
        progresso.setUltimaPagina(input.getUltimaPagina() != null && input.getUltimaPagina() > 0 ? input.getUltimaPagina() : null);
        progresso.setAtualizadoEm(LocalDateTime.now());

        ApostilaProgresso salvo = apostilaProgressoRepository.save(progresso);
        return toDto(salvo);
    }

    private ApostilaProgressoDTO toDto(ApostilaProgresso entity) {
        return ApostilaProgressoDTO.builder()
                .pdfId(entity.getPdfId())
                .concluido(Boolean.TRUE.equals(entity.getConcluido()))
                .anotacoes(entity.getAnotacoes() == null ? "" : entity.getAnotacoes())
                .grifos(readGrifos(entity.getGrifosJson()))
                .ultimaPagina(entity.getUltimaPagina())
                .build();
    }

    private String writeGrifos(List<ApostilaHighlightDTO> grifos) {
        try {
            return objectMapper.writeValueAsString(grifos == null ? List.of() : grifos);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Falha ao serializar grifos");
        }
    }

    private List<ApostilaHighlightDTO> readGrifos(String json) {
        try {
            if (json == null || json.isBlank()) {
                return List.of();
            }
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception ex) {
            return List.of();
        }
    }
}
