package com.aprovati.apostila.service;

import com.aprovati.apostila.dto.*;
import com.aprovati.apostila.entity.ApostilaArquivo;
import com.aprovati.apostila.entity.ApostilaAssunto;
import com.aprovati.apostila.entity.ApostilaDisciplina;
import com.aprovati.apostila.repository.ApostilaArquivoRepository;
import com.aprovati.apostila.repository.ApostilaAssuntoRepository;
import com.aprovati.apostila.repository.ApostilaDisciplinaRepository;
import com.aprovati.repository.QuestaoRepository;
import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApostilaCatalogoService {

    private final ApostilaDisciplinaRepository disciplinaRepository;
    private final ApostilaAssuntoRepository assuntoRepository;
    private final ApostilaArquivoRepository arquivoRepository;
    private final QuestaoRepository questaoRepository;
    @Value("${app.apostilas.storage-dir:./data/apostilas}")
    private String storageDir;

    public List<ApostilaDisciplinaCatalogoDTO> listarCatalogo() {
        return disciplinaRepository.findAll().stream()
                .sorted(Comparator.comparing(ApostilaDisciplina::getNome, String.CASE_INSENSITIVE_ORDER))
                .map(this::toDisciplinaDto)
                .toList();
    }

    public List<String> listarDisciplinasSugeridas() {
        return questaoRepository.findDistinctDisciplinas().stream()
                .map(Enum::name)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    public List<ApostilaDisciplinaCatalogoDTO> criarDisciplina(String nome) {
        String normalized = safe(nome);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Nome da disciplina é obrigatório.");
        }
        disciplinaRepository.findByNomeIgnoreCase(normalized).ifPresent(d -> {
            throw new IllegalArgumentException("Disciplina já cadastrada.");
        });
        disciplinaRepository.save(ApostilaDisciplina.builder().nome(normalized).build());
        return listarCatalogo();
    }

    public List<ApostilaDisciplinaCatalogoDTO> removerDisciplina(Long disciplinaId) {
        ApostilaDisciplina disciplina = disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina não encontrada."));
        disciplinaRepository.delete(disciplina);
        return listarCatalogo();
    }

    public List<ApostilaDisciplinaCatalogoDTO> criarAssunto(Long disciplinaId, String nome) {
        String normalized = safe(nome);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Nome do assunto é obrigatório.");
        }
        ApostilaDisciplina disciplina = disciplinaRepository.findById(disciplinaId)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina não encontrada."));
        assuntoRepository.save(ApostilaAssunto.builder().nome(normalized).disciplina(disciplina).build());
        return listarCatalogo();
    }

    public List<ApostilaDisciplinaCatalogoDTO> removerAssunto(Long assuntoId) {
        ApostilaAssunto assunto = assuntoRepository.findById(assuntoId)
                .orElseThrow(() -> new IllegalArgumentException("Assunto não encontrado."));
        assuntoRepository.delete(assunto);
        return listarCatalogo();
    }

    public List<ApostilaDisciplinaCatalogoDTO> criarArquivo(AdminApostilaRequests.CreateArquivoRequest request) {
        ApostilaAssunto assunto = assuntoRepository.findById(request.getAssuntoId())
                .orElseThrow(() -> new IllegalArgumentException("Assunto não encontrado."));
        String titulo = safe(request.getTitulo());
        String url = safe(request.getUrl());
        if (titulo.isBlank() || url.isBlank()) {
            throw new IllegalArgumentException("Título e URL são obrigatórios.");
        }
        arquivoRepository.save(ApostilaArquivo.builder()
                .assunto(assunto)
                .titulo(titulo)
                .url(url)
                .storagePath(null)
                .paginas(request.getPaginas())
                .build());
        return listarCatalogo();
    }

    public List<ApostilaDisciplinaCatalogoDTO> criarArquivoUpload(
            Long assuntoId,
            String tituloRaw,
            Integer paginas,
            MultipartFile file
    ) {
        ApostilaAssunto assunto = assuntoRepository.findById(assuntoId)
                .orElseThrow(() -> new IllegalArgumentException("Assunto não encontrado."));
        String titulo = safe(tituloRaw);
        if (titulo.isBlank()) {
            throw new IllegalArgumentException("Título é obrigatório.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo PDF é obrigatório.");
        }
        String contentType = safe(file.getContentType());
        String originalName = safe(file.getOriginalFilename()).toLowerCase();
        if (!MediaType.APPLICATION_PDF_VALUE.equals(contentType) && !originalName.endsWith(".pdf")) {
            throw new IllegalArgumentException("Somente arquivos PDF são permitidos.");
        }

        try {
            Path baseDir = Path.of(storageDir).toAbsolutePath().normalize();
            Files.createDirectories(baseDir);
            String filename = UUID.randomUUID() + ".pdf";
            Path target = baseDir.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            ApostilaArquivo salvo = arquivoRepository.save(ApostilaArquivo.builder()
                    .assunto(assunto)
                    .titulo(titulo)
                    .url("")
                    .storagePath(filename)
                    .paginas(paginas)
                    .build());
            salvo.setUrl("/apostilas/arquivos/" + salvo.getId() + "/conteudo");
            arquivoRepository.save(salvo);
            return listarCatalogo();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Falha ao salvar arquivo PDF.");
        }
    }

    public List<ApostilaDisciplinaCatalogoDTO> atualizarArquivo(Long arquivoId, AdminApostilaRequests.UpdateArquivoRequest request) {
        ApostilaArquivo arquivo = arquivoRepository.findById(arquivoId)
                .orElseThrow(() -> new IllegalArgumentException("Arquivo não encontrado."));
        String titulo = safe(request.getTitulo());
        String url = safe(request.getUrl());
        if (titulo.isBlank() || url.isBlank()) {
            throw new IllegalArgumentException("Título e URL são obrigatórios.");
        }
        arquivo.setTitulo(titulo);
        arquivo.setUrl(url);
        arquivo.setStoragePath(null);
        arquivo.setPaginas(request.getPaginas());
        arquivoRepository.save(arquivo);
        return listarCatalogo();
    }

    public List<ApostilaDisciplinaCatalogoDTO> removerArquivo(Long arquivoId) {
        ApostilaArquivo arquivo = arquivoRepository.findById(arquivoId)
                .orElseThrow(() -> new IllegalArgumentException("Arquivo não encontrado."));
        arquivoRepository.delete(arquivo);
        return listarCatalogo();
    }

    public ApostilaArquivo buscarArquivo(Long arquivoId) {
        return arquivoRepository.findById(arquivoId)
                .orElseThrow(() -> new IllegalArgumentException("Arquivo não encontrado."));
    }

    public Path resolverArquivoStorage(ApostilaArquivo arquivo) {
        String stored = safe(arquivo.getStoragePath());
        if (stored.isBlank()) {
            throw new IllegalArgumentException("Arquivo não possui armazenamento local.");
        }
        return Path.of(storageDir).toAbsolutePath().normalize().resolve(stored).normalize();
    }

    private ApostilaDisciplinaCatalogoDTO toDisciplinaDto(ApostilaDisciplina d) {
        List<ApostilaAssuntoCatalogoDTO> trilhas = d.getAssuntos().stream()
                .sorted(Comparator.comparing(ApostilaAssunto::getNome, String.CASE_INSENSITIVE_ORDER))
                .map(a -> ApostilaAssuntoCatalogoDTO.builder()
                        .id(a.getId())
                        .assunto(a.getNome())
                        .arquivos(a.getArquivos().stream()
                                .sorted(Comparator.comparing(ApostilaArquivo::getTitulo, String.CASE_INSENSITIVE_ORDER))
                                .map(arq -> ApostilaArquivoCatalogoDTO.builder()
                                        .id(arq.getId())
                                        .titulo(arq.getTitulo())
                                        .url(arq.getUrl())
                                        .paginas(arq.getPaginas())
                                        .build())
                                .toList())
                        .build())
                .toList();

        return ApostilaDisciplinaCatalogoDTO.builder()
                .id(d.getId())
                .disciplina(d.getNome())
                .trilhas(trilhas)
                .build();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
