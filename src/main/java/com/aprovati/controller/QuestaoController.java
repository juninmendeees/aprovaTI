package com.aprovati.controller;

import com.aprovati.dto.*;
import com.aprovati.security.AuthenticatedUserService;
import com.aprovati.service.QuestaoEnunciadoImagemService;
import com.aprovati.service.QuestaoService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/questoes")
@RequiredArgsConstructor
public class QuestaoController {

    private final QuestaoService service;
    private final QuestaoEnunciadoImagemService questaoEnunciadoImagemService;
    private final AuthenticatedUserService authenticatedUserService;

    @PostMapping
    public ResponseEntity<QuestaoResponseDTO> criar(@RequestBody QuestaoRequestDTO dto) {
        return ResponseEntity.ok(service.criar(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestaoResponseDTO> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @GetMapping("/filtros/opcoes")
    public ResponseEntity<QuestaoFiltroOpcoesDTO> listarOpcoesFiltro() {
        return ResponseEntity.ok(service.listarOpcoesFiltro());
    }

    @GetMapping("/{id}/enunciado-imagem")
    public ResponseEntity<byte[]> enunciadoImagem(@PathVariable Long id) {
        return questaoEnunciadoImagemService.load(id)
                .map(img -> ResponseEntity.ok()
                        .contentType(img.mediaType())
                        .body(img.bytes()))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<QuestaoResponseDTO>> filtrar(
            @RequestParam(required = false) String disciplina,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String banca,
            @RequestParam(required = false) String assunto,
            @RequestParam(required = false) Long questaoId,
            @RequestParam(required = false) String cargoFuncao,
            @RequestParam(required = false) Boolean naoRespondidas,
            @RequestParam(required = false) Boolean somenteErrei,
            @RequestParam(required = false) Integer limite,
            @RequestParam(required = false) Boolean ordemAleatoria
        ) {
        return ResponseEntity.ok(
                service.filtrar(
                        disciplina,
                        ano,
                        banca,
                        assunto,
                        questaoId,
                        cargoFuncao,
                        naoRespondidas,
                        somenteErrei,
                        limite,
                        ordemAleatoria,
                        authenticatedUserService.getCurrentUsuario().getId()
                )
        );
    }
}