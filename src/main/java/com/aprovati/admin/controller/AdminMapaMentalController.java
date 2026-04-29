package com.aprovati.admin.controller;

import com.aprovati.mapamental.dto.MapaMentalDTO;
import com.aprovati.mapamental.service.MapaMentalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/mapas-mentais")
@RequiredArgsConstructor
public class AdminMapaMentalController {

    private final MapaMentalService mapaMentalService;

    @GetMapping
    public ResponseEntity<List<MapaMentalDTO>> listar(
            @RequestParam(required = false) String disciplina,
            @RequestParam(required = false) String assunto
    ) {
        return ResponseEntity.ok(mapaMentalService.listar(disciplina, assunto));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<MapaMentalDTO> criar(
            @RequestParam String disciplina,
            @RequestParam String assunto,
            @RequestParam String titulo,
            @RequestPart("imagem") MultipartFile imagem
    ) {
        return ResponseEntity.ok(mapaMentalService.criar(disciplina, assunto, titulo, imagem));
    }

    @PutMapping(value = "/{mapaId}", consumes = "multipart/form-data")
    public ResponseEntity<MapaMentalDTO> atualizar(
            @PathVariable Long mapaId,
            @RequestParam String disciplina,
            @RequestParam String assunto,
            @RequestParam String titulo,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem
    ) {
        return ResponseEntity.ok(mapaMentalService.atualizar(mapaId, disciplina, assunto, titulo, imagem));
    }

    @DeleteMapping("/{mapaId}")
    public ResponseEntity<Void> remover(@PathVariable Long mapaId) {
        mapaMentalService.remover(mapaId);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidation(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensagem", ex.getMessage()));
    }
}
