package com.aprovati.flashcard.service;

import com.aprovati.entity.Usuario;
import com.aprovati.flashcard.dto.FlashcardDTO;
import com.aprovati.flashcard.entity.Flashcard;
import com.aprovati.flashcard.entity.FlashcardOrigem;
import com.aprovati.flashcard.entity.FlashcardResultadoRevisao;
import com.aprovati.flashcard.entity.FlashcardRevisao;
import com.aprovati.flashcard.repository.FlashcardRepository;
import com.aprovati.flashcard.repository.FlashcardRevisaoRepository;
import com.aprovati.repository.QuestaoRepository;
import com.aprovati.security.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private static final int[] INTERVALOS_DIAS = {1, 7, 15, 30};

    private final FlashcardRepository flashcardRepository;
    private final FlashcardRevisaoRepository flashcardRevisaoRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final QuestaoRepository questaoRepository;

    @Transactional(readOnly = true)
    public List<String> listarDisciplinasVisiveis() {
        Long usuarioId = authenticatedUserService.getCurrentUsuario().getId();
        Set<String> disciplinas = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        disciplinas.addAll(
                questaoRepository.findDistinctDisciplinas().stream()
                        .map(Enum::name)
                        .toList()
        );
        disciplinas.addAll(flashcardRepository.listarDisciplinasVisiveis(usuarioId));
        return disciplinas.stream().filter(v -> v != null && !v.isBlank()).toList();
    }

    @Transactional(readOnly = true)
    public List<FlashcardDTO> listarFlashcards(String disciplina, String origem) {
        Usuario usuario = authenticatedUserService.getCurrentUsuario();
        List<Flashcard> cards = flashcardRepository.listarVisiveis(
                usuario.getId(),
                normalizarDisciplinaFiltro(disciplina),
                "PADRAO".equalsIgnoreCase(origem),
                "PESSOAL".equalsIgnoreCase(origem)
        );
        return mapearComRevisao(cards, usuario.getId());
    }

    @Transactional(readOnly = true)
    public List<FlashcardDTO> listarPendentesHoje(String disciplina, String origem) {
        LocalDate hoje = LocalDate.now();
        return listarFlashcards(disciplina, origem).stream()
                .filter(dto -> dto.getProximaRevisao() == null || !dto.getProximaRevisao().isAfter(hoje))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FlashcardDTO> listarPadraoAdmin(String disciplina) {
        Long usuarioId = authenticatedUserService.getCurrentUsuario().getId();
        return mapearComRevisao(flashcardRepository.listarPadrao(normalizarDisciplinaFiltro(disciplina)), usuarioId);
    }

    @Transactional
    public FlashcardDTO criarPessoal(String disciplina, String frente, String verso, MultipartFile imagem) {
        Usuario usuario = authenticatedUserService.getCurrentUsuario();
        Flashcard card = buildFlashcard(disciplina, frente, verso, imagem, usuario);
        return mapearComRevisao(List.of(flashcardRepository.save(card)), usuario.getId()).get(0);
    }

    @Transactional
    public FlashcardDTO criarPadraoAdmin(String disciplina, String frente, String verso, MultipartFile imagem) {
        Flashcard card = buildFlashcard(disciplina, frente, verso, imagem, null);
        return mapearComRevisao(List.of(flashcardRepository.save(card)), authenticatedUserService.getCurrentUsuario().getId()).get(0);
    }

    @Transactional
    public FlashcardDTO atualizarPadraoAdmin(Long flashcardId, String disciplina, String frente, String verso, MultipartFile imagem) {
        Long usuarioId = authenticatedUserService.getCurrentUsuario().getId();
        Flashcard card = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new IllegalArgumentException("Flashcard não encontrado."));
        if (card.getOwnerUsuario() != null) {
            throw new IllegalArgumentException("Somente flashcards padrão podem ser editados nesta tela.");
        }
        card.setDisciplina(validarCampo(disciplina, "Disciplina é obrigatória."));
        card.setFrente(validarCampo(frente, "Frente do cartão é obrigatória."));
        card.setVerso(validarCampo(verso, "Verso do cartão é obrigatório."));
        card.setUpdatedAt(LocalDateTime.now());
        aplicarImagem(card, imagem);
        return mapearComRevisao(List.of(flashcardRepository.save(card)), usuarioId).get(0);
    }

    @Transactional
    public void removerPadraoAdmin(Long flashcardId) {
        Flashcard card = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new IllegalArgumentException("Flashcard não encontrado."));
        if (card.getOwnerUsuario() != null) {
            throw new IllegalArgumentException("Somente flashcards padrão podem ser removidos nesta tela.");
        }
        flashcardRepository.delete(card);
    }

    @Transactional
    public FlashcardDTO atualizarPessoal(Long flashcardId, String disciplina, String frente, String verso, MultipartFile imagem) {
        Usuario usuario = authenticatedUserService.getCurrentUsuario();
        Flashcard card = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new IllegalArgumentException("Flashcard não encontrado."));
        if (card.getOwnerUsuario() == null || !Objects.equals(card.getOwnerUsuario().getId(), usuario.getId())) {
            throw new IllegalArgumentException("Você só pode editar flashcards próprios.");
        }
        card.setDisciplina(validarCampo(disciplina, "Disciplina é obrigatória."));
        card.setFrente(validarCampo(frente, "Frente do cartão é obrigatória."));
        card.setVerso(validarCampo(verso, "Verso do cartão é obrigatório."));
        card.setUpdatedAt(LocalDateTime.now());
        aplicarImagem(card, imagem);
        return mapearComRevisao(List.of(flashcardRepository.save(card)), usuario.getId()).get(0);
    }

    @Transactional
    public void removerPessoal(Long flashcardId) {
        Usuario usuario = authenticatedUserService.getCurrentUsuario();
        Flashcard card = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new IllegalArgumentException("Flashcard não encontrado."));
        if (card.getOwnerUsuario() == null || !Objects.equals(card.getOwnerUsuario().getId(), usuario.getId())) {
            throw new IllegalArgumentException("Você só pode remover flashcards próprios.");
        }
        flashcardRepository.delete(card);
    }

    @Transactional
    public FlashcardDTO registrarRevisao(Long flashcardId, FlashcardResultadoRevisao resultado) {
        if (resultado == null) {
            throw new IllegalArgumentException("Resultado da revisão é obrigatório.");
        }
        Usuario usuario = authenticatedUserService.getCurrentUsuario();
        Flashcard card = flashcardRepository.buscarVisivel(flashcardId, usuario.getId())
                .orElseThrow(() -> new IllegalArgumentException("Flashcard não encontrado."));

        FlashcardRevisao revisao = flashcardRevisaoRepository.findByUsuarioIdAndFlashcardId(usuario.getId(), flashcardId)
                .orElseGet(() -> FlashcardRevisao.builder()
                        .usuario(usuario)
                        .flashcard(card)
                        .etapa(-1)
                        .intervaloDias(1)
                        .proximaRevisao(LocalDate.now())
                        .totalRevisoes(0)
                        .build());

        int etapaAtual = revisao.getEtapa() == null ? -1 : revisao.getEtapa();
        int novaEtapa;
        int novoIntervalo;
        if (resultado == FlashcardResultadoRevisao.ERREI) {
            novaEtapa = 0;
            novoIntervalo = INTERVALOS_DIAS[0];
        } else {
            novaEtapa = Math.min(etapaAtual + 1, INTERVALOS_DIAS.length - 1);
            novoIntervalo = INTERVALOS_DIAS[novaEtapa];
        }

        revisao.setEtapa(novaEtapa);
        revisao.setIntervaloDias(novoIntervalo);
        revisao.setProximaRevisao(LocalDate.now().plusDays(novoIntervalo));
        revisao.setUltimaRevisao(LocalDateTime.now());
        revisao.setTotalRevisoes((revisao.getTotalRevisoes() == null ? 0 : revisao.getTotalRevisoes()) + 1);
        flashcardRevisaoRepository.save(revisao);

        return mapearComRevisao(List.of(card), usuario.getId()).get(0);
    }

    private Flashcard buildFlashcard(String disciplina, String frente, String verso, MultipartFile imagem, Usuario owner) {
        Flashcard card = Flashcard.builder()
                .disciplina(validarCampo(disciplina, "Disciplina é obrigatória."))
                .frente(validarCampo(frente, "Frente do cartão é obrigatória."))
                .verso(validarCampo(verso, "Verso do cartão é obrigatório."))
                .ownerUsuario(owner)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        aplicarImagem(card, imagem);
        return card;
    }

    private void aplicarImagem(Flashcard card, MultipartFile imagem) {
        if (imagem == null || imagem.isEmpty()) {
            return;
        }
        String contentType = limpar(imagem.getContentType());
        if (!contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Anexo inválido. Envie apenas imagens.");
        }
        try {
            card.setImagemBytes(imagem.getBytes());
            card.setImagemContentType(contentType);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Falha ao processar imagem do flashcard.");
        }
    }

    private List<FlashcardDTO> mapearComRevisao(List<Flashcard> cards, Long usuarioId) {
        if (cards.isEmpty()) return List.of();
        List<Long> ids = cards.stream().map(Flashcard::getId).toList();
        Map<Long, FlashcardRevisao> revisoes = flashcardRevisaoRepository.listarPorUsuarioEFlashcards(usuarioId, ids)
                .stream()
                .collect(Collectors.toMap(r -> r.getFlashcard().getId(), r -> r));

        LocalDate hoje = LocalDate.now();
        return cards.stream().map(card -> {
            FlashcardRevisao revisao = revisoes.get(card.getId());
            LocalDate proxima = revisao != null ? revisao.getProximaRevisao() : hoje;
            Integer etapa = revisao != null ? revisao.getEtapa() : -1;
            Integer intervalo = revisao != null ? revisao.getIntervaloDias() : 1;
            return FlashcardDTO.builder()
                    .id(card.getId())
                    .disciplina(card.getDisciplina())
                    .frente(card.getFrente())
                    .verso(card.getVerso())
                    .origem(card.getOwnerUsuario() == null ? FlashcardOrigem.PADRAO : FlashcardOrigem.PESSOAL)
                    .ownerUsuarioId(card.getOwnerUsuario() == null ? null : card.getOwnerUsuario().getId())
                    .imagemDataUrl(toDataUrl(card.getImagemContentType(), card.getImagemBytes()))
                    .etapaRevisao(etapa)
                    .intervaloDias(intervalo)
                    .proximaRevisao(proxima)
                    .ultimaRevisao(revisao == null ? null : revisao.getUltimaRevisao())
                    .totalRevisoes(revisao == null ? 0 : revisao.getTotalRevisoes())
                    .pendenteHoje(!proxima.isAfter(hoje))
                    .build();
        }).toList();
    }

    private String toDataUrl(String contentType, byte[] bytes) {
        if (bytes == null || bytes.length == 0 || contentType == null || contentType.isBlank()) {
            return null;
        }
        return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private String validarCampo(String value, String msg) {
        String cleaned = limpar(value);
        if (cleaned.isBlank()) {
            throw new IllegalArgumentException(msg);
        }
        return cleaned;
    }

    private String limpar(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizarDisciplinaFiltro(String value) {
        String cleaned = limpar(value);
        return cleaned.isBlank() ? null : cleaned;
    }
}
