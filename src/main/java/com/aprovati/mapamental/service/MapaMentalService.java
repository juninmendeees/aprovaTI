package com.aprovati.mapamental.service;

import com.aprovati.mapamental.dto.MapaMentalDTO;
import com.aprovati.mapamental.entity.MapaMental;
import com.aprovati.mapamental.repository.MapaMentalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MapaMentalService {

    private final MapaMentalRepository mapaMentalRepository;

    @Transactional(readOnly = true)
    public List<String> listarDisciplinas() {
        return mapaMentalRepository.listarDisciplinas();
    }

    @Transactional(readOnly = true)
    public List<MapaMentalDTO> listar(String disciplina, String assunto) {
        return mapaMentalRepository.listar(normalizarFiltro(disciplina), normalizarFiltro(assunto))
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public MapaMentalDTO criar(String disciplina, String assunto, String titulo, MultipartFile imagem) {
        MapaMental mapa = MapaMental.builder()
                .disciplina(validarCampo(disciplina, "Disciplina é obrigatória."))
                .assunto(validarCampo(assunto, "Assunto é obrigatório."))
                .titulo(validarCampo(titulo, "Título é obrigatório."))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        aplicarImagemObrigatoria(mapa, imagem);
        return toDto(mapaMentalRepository.save(mapa));
    }

    @Transactional
    public MapaMentalDTO atualizar(Long mapaId, String disciplina, String assunto, String titulo, MultipartFile imagem) {
        MapaMental mapa = mapaMentalRepository.findById(mapaId)
                .orElseThrow(() -> new IllegalArgumentException("Mapa mental não encontrado."));
        mapa.setDisciplina(validarCampo(disciplina, "Disciplina é obrigatória."));
        mapa.setAssunto(validarCampo(assunto, "Assunto é obrigatório."));
        mapa.setTitulo(validarCampo(titulo, "Título é obrigatório."));
        mapa.setUpdatedAt(LocalDateTime.now());
        aplicarImagemOpcional(mapa, imagem);
        return toDto(mapaMentalRepository.save(mapa));
    }

    @Transactional
    public void remover(Long mapaId) {
        MapaMental mapa = mapaMentalRepository.findById(mapaId)
                .orElseThrow(() -> new IllegalArgumentException("Mapa mental não encontrado."));
        mapaMentalRepository.delete(mapa);
    }

    private void aplicarImagemObrigatoria(MapaMental mapa, MultipartFile imagem) {
        if (imagem == null || imagem.isEmpty()) {
            throw new IllegalArgumentException("Imagem do mapa mental é obrigatória.");
        }
        aplicarImagemOpcional(mapa, imagem);
    }

    private void aplicarImagemOpcional(MapaMental mapa, MultipartFile imagem) {
        if (imagem == null || imagem.isEmpty()) {
            return;
        }
        String contentType = sanitizar(imagem.getContentType());
        if (!contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Anexo inválido. Envie apenas imagens.");
        }
        try {
            mapa.setImagemBytes(imagem.getBytes());
            mapa.setImagemContentType(contentType);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Falha ao processar imagem do mapa mental.");
        }
    }

    private MapaMentalDTO toDto(MapaMental mapa) {
        return MapaMentalDTO.builder()
                .id(mapa.getId())
                .disciplina(mapa.getDisciplina())
                .assunto(mapa.getAssunto())
                .titulo(mapa.getTitulo())
                .imagemDataUrl(toDataUrl(mapa.getImagemContentType(), mapa.getImagemBytes()))
                .createdAt(mapa.getCreatedAt())
                .updatedAt(mapa.getUpdatedAt())
                .build();
    }

    private String toDataUrl(String contentType, byte[] bytes) {
        if (bytes == null || bytes.length == 0 || contentType == null || contentType.isBlank()) {
            return null;
        }
        return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private String validarCampo(String value, String mensagem) {
        String cleaned = sanitizar(value);
        if (cleaned.isBlank()) {
            throw new IllegalArgumentException(mensagem);
        }
        return cleaned;
    }

    private String normalizarFiltro(String value) {
        String cleaned = sanitizar(value);
        return cleaned.isBlank() ? null : cleaned;
    }

    private String sanitizar(String value) {
        return value == null ? "" : value.trim();
    }
}
