package com.aprovati.apostila.controller;

import com.aprovati.apostila.dto.ApostilaProgressoDTO;
import com.aprovati.apostila.service.ApostilaProgressoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/apostilas/progresso")
@RequiredArgsConstructor
public class ApostilaProgressoController {

    private final ApostilaProgressoService apostilaProgressoService;

    @GetMapping
    public ResponseEntity<List<ApostilaProgressoDTO>> listar() {
        return ResponseEntity.ok(apostilaProgressoService.listarDoUsuarioAtual());
    }

    @PutMapping("/{pdfId}")
    public ResponseEntity<ApostilaProgressoDTO> salvar(
            @PathVariable String pdfId,
            @RequestBody ApostilaProgressoDTO request
    ) {
        return ResponseEntity.ok(apostilaProgressoService.salvarDoUsuarioAtual(pdfId, request));
    }
}
