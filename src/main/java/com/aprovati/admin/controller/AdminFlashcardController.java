package com.aprovati.admin.controller;

import com.aprovati.flashcard.dto.FlashcardDTO;
import com.aprovati.flashcard.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/flashcards")
@RequiredArgsConstructor
public class AdminFlashcardController {

    private final FlashcardService flashcardService;

    @GetMapping
    public ResponseEntity<List<FlashcardDTO>> listarPadrao(@RequestParam(required = false) String disciplina) {
        return ResponseEntity.ok(flashcardService.listarPadraoAdmin(disciplina));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<FlashcardDTO> criarPadrao(
            @RequestParam String disciplina,
            @RequestParam String frente,
            @RequestParam String verso,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem
    ) {
        return ResponseEntity.ok(flashcardService.criarPadraoAdmin(disciplina, frente, verso, imagem));
    }

    @PutMapping(value = "/{flashcardId}", consumes = "multipart/form-data")
    public ResponseEntity<FlashcardDTO> atualizarPadrao(
            @PathVariable Long flashcardId,
            @RequestParam String disciplina,
            @RequestParam String frente,
            @RequestParam String verso,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem
    ) {
        return ResponseEntity.ok(flashcardService.atualizarPadraoAdmin(flashcardId, disciplina, frente, verso, imagem));
    }

    @DeleteMapping("/{flashcardId}")
    public ResponseEntity<Void> removerPadrao(@PathVariable Long flashcardId) {
        flashcardService.removerPadraoAdmin(flashcardId);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidation(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensagem", ex.getMessage()));
    }
}
