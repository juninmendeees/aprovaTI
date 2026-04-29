package com.aprovati.controller;

import com.aprovati.dto.RespostaRequest;
import com.aprovati.dto.RespostaResponseDTO;
import com.aprovati.security.AuthenticatedUserService;
import com.aprovati.service.RespostaService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/respostas")
@RequiredArgsConstructor
public class RespostaController {

    private final RespostaService respostaService;
    private final AuthenticatedUserService authenticatedUserService;

    /**
     * Endpoint para responder uma questão
     */
    @PostMapping
    public ResponseEntity<RespostaResponseDTO> responder(@RequestBody RespostaRequest request) {

        RespostaResponseDTO response = respostaService.responder(
                authenticatedUserService.getCurrentUsuario().getId(),
                request.getQuestaoId(),
                request.getResposta()
        );

        return ResponseEntity.ok(response);
    }
}