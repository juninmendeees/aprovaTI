package com.aprovati.service;

import com.aprovati.dto.QuestaoFiltroOpcoesDTO;
import com.aprovati.dto.QuestaoRequestDTO;
import com.aprovati.dto.QuestaoResponseDTO;
import com.aprovati.entity.Questao;
import com.aprovati.mapper.QuestaoMapper;
import com.aprovati.repository.QuestaoRepository;
import com.aprovati.repository.RespostaUsuarioRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import static com.aprovati.specification.QuestaoSpecification.*;

@Service
@RequiredArgsConstructor
public class QuestaoService {

    private final QuestaoRepository repository;
    private final RespostaUsuarioRepository respostaRepository;
    private final QuestaoEnunciadoImagemService questaoEnunciadoImagemService;

    public QuestaoResponseDTO criar(QuestaoRequestDTO dto) {

        validarQuestao(dto);

        Questao questao = QuestaoMapper.toEntity(dto);

        Questao salva = repository.save(questao);

        return QuestaoMapper.toDTO(salva);
    }

    public List<QuestaoResponseDTO> listar() {
        return repository.findAll()
                .stream()
                .map(QuestaoMapper::toDTO)
                .collect(Collectors.toList());
    }

    public QuestaoResponseDTO buscarPorId(Long id) {
        Questao questao = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Questão não encontrada"));

        return QuestaoMapper.toDTO(questao);
    }

    public void deletar(Long id) {
        questaoEnunciadoImagemService.deleteIfExists(id);
        repository.deleteById(id);
    }

    private void validarQuestao(QuestaoRequestDTO dto) {

        if (dto.getAlternativas() == null || dto.getAlternativas().isEmpty()) {
            throw new RuntimeException("Questão deve ter alternativas");
        }

        boolean existeGabarito = dto.getAlternativas().stream()
                .anyMatch(a -> a.getLetra().equalsIgnoreCase(dto.getGabarito()));

        if (!existeGabarito) {
            throw new RuntimeException("Gabarito inválido");
        }
    }

    public List<QuestaoResponseDTO> filtrar(
            String disciplina,
            Integer ano,
            String banca,
            String assunto,
            Long questaoId,
            String cargoFuncao,
            Boolean naoRespondidas,
            Boolean somenteErrei,
            Integer limite,
            Boolean ordemAleatoria,
            Long usuarioId
    ) {
        Specification<Questao> spec = (root, query, cb) -> cb.conjunction();

        spec = spec
                .and(disciplinaEquals(disciplina))
                .and(anoEquals(ano))
                .and(bancaEquals(banca))
                .and(assuntoContains(assunto))
                .and(idEquals(questaoId))
                .and(cargoFuncaoContains(cargoFuncao));

        List<Questao> questoes = repository.findAll(spec);

        if (usuarioId != null && Boolean.TRUE.equals(naoRespondidas)) {
            Set<Long> idsNaoRespondidas = repository.findNaoRespondidas(usuarioId).stream()
                    .map(Questao::getId)
                    .collect(Collectors.toSet());
            questoes = questoes.stream()
                    .filter(q -> idsNaoRespondidas.contains(q.getId()))
                    .collect(Collectors.toList());
        }

        if (usuarioId != null && Boolean.TRUE.equals(somenteErrei)) {
            Set<Long> idsSomenteErrei = repository.findSomenteErrei(usuarioId).stream()
                    .map(Questao::getId)
                    .collect(Collectors.toSet());
            questoes = questoes.stream()
                    .filter(q -> idsSomenteErrei.contains(q.getId()))
                    .collect(Collectors.toList());
        }

        if (Boolean.TRUE.equals(ordemAleatoria)) {
            Collections.shuffle(questoes);
        } else {
            questoes.sort(Comparator.comparing(Questao::getId));
        }

        if (limite != null && limite > 0 && questoes.size() > limite) {
            questoes = questoes.subList(0, limite);
        }

        return questoes.stream()
                .map(QuestaoMapper::toDTO)
                .toList();
    }

    public QuestaoFiltroOpcoesDTO listarOpcoesFiltro() {
        List<String> disciplinas = repository.findDistinctDisciplinas().stream()
                .filter(Objects::nonNull)
                .map(Enum::name)
                .toList();

        LinkedHashMap<String, String> bancasMap = new LinkedHashMap<>();
        for (String banca : repository.findDistinctBancas()) {
            if (banca == null) {
                continue;
            }
            String normalized = banca.trim();
            if (normalized.isBlank()) {
                continue;
            }
            String key = normalized.toLowerCase(Locale.ROOT);
            bancasMap.putIfAbsent(key, normalized);
        }
        List<String> bancas = bancasMap.values().stream().toList();

        return QuestaoFiltroOpcoesDTO.builder()
                .disciplinas(disciplinas)
                .bancas(bancas)
                .build();
    }
}
