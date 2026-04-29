package com.aprovati.service;

import com.aprovati.billing.exception.SubscriptionAccessException;
import com.aprovati.billing.service.SubscriptionAccessService;
import com.aprovati.dto.RespostaResponseDTO;
import com.aprovati.entity.Questao;
import com.aprovati.entity.RespostaUsuario;
import com.aprovati.entity.SubscriptionStatus;
import com.aprovati.entity.Usuario;
import com.aprovati.repository.QuestaoRepository;
import com.aprovati.repository.RespostaUsuarioRepository;
import com.aprovati.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class RespostaService {

    private final QuestaoRepository questaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RespostaUsuarioRepository respostaRepository;
    private final SubscriptionAccessService subscriptionAccessService;

    public RespostaResponseDTO responder(Long usuarioId, Long questaoId, String resposta) {

        // 🔹 Busca a questão
        Questao questao = questaoRepository.findById(questaoId)
                .orElseThrow(() -> new RuntimeException("Questão não encontrada"));

        // 🔹 Busca o usuário
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        subscriptionAccessService.refreshTrialIfExpired(usuario);

        if (usuario.getSubscriptionStatus() == SubscriptionStatus.TRIALING) {
            LocalDateTime start = LocalDateTime.now().toLocalDate().atStartOfDay();
            LocalDateTime end = start.plusDays(1);
            long totalHoje = respostaRepository.countByUsuarioIdAndDataRespostaBetween(usuarioId, start, end);
            if (totalHoje >= 10) {
                throw new SubscriptionAccessException(
                        "TRIAL_DAILY_QUESTION_LIMIT",
                        "No trial você pode responder até 10 questões por dia. Assine para continuar."
                );
            }
        }

        // 🔹 Verifica se a resposta está correta
        boolean correta = questao.getGabarito().equalsIgnoreCase(resposta);

        // 🔹 Cria entidade
        RespostaUsuario respostaUsuario = RespostaUsuario.builder()
                .usuario(usuario)
                .questao(questao)
                .respostaMarcada(resposta)
                .correta(correta)
                .dataResposta(LocalDateTime.now())
                .build();

        // 🔹 Salva no banco
        RespostaUsuario salva = respostaRepository.save(respostaUsuario);

        // 🔹 Formatação de data (boa prática)
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        // 🔥 Conversão para DTO (ponto chave)
        return RespostaResponseDTO.builder()
                .id(salva.getId())
                .respostaMarcada(salva.getRespostaMarcada())
                .correta(salva.getCorreta())
                .dataResposta(salva.getDataResposta().format(formatter))
                .usuarioId(usuario.getId())
                .questaoId(questao.getId())
                .build();
    }
}