package com.aprovati.dashboard.service;

import com.aprovati.entity.RespostaUsuario;
import com.aprovati.repository.RespostaUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final RespostaUsuarioRepository repository;

    public Map<String, Object> getDashboard(Long usuarioId) {

        List<RespostaUsuario> respostas = repository.findByUsuarioId(usuarioId);

        long total = respostas.size();
        long acertos = respostas.stream().filter(RespostaUsuario::getCorreta).count();

        double percentual = total == 0 ? 0 : (acertos * 100.0) / total;

        // 🔥 Agrupamento por disciplina
        Map<String, List<RespostaUsuario>> porDisciplina =
                respostas.stream()
                        .collect(Collectors.groupingBy(r -> r.getQuestao().getDisciplina().name()));

        List<Map<String, Object>> disciplinas = new ArrayList<>();

        for (String disciplina : porDisciplina.keySet()) {

            List<RespostaUsuario> lista = porDisciplina.get(disciplina);

            long totalDisc = lista.size();
            long acertosDisc = lista.stream().filter(RespostaUsuario::getCorreta).count();

            double percDisc = totalDisc == 0 ? 0 : (acertosDisc * 100.0) / totalDisc;

            Map<String, Object> item = new HashMap<>();
            item.put("disciplina", disciplina);
            item.put("total", totalDisc);
            item.put("acertos", acertosDisc);
            item.put("percentual", percDisc);

            disciplinas.add(item);
        }

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("total", total);
        dashboard.put("acertos", acertos);
        dashboard.put("percentual", percentual);
        dashboard.put("disciplinas", disciplinas);

        return dashboard;
    }
}