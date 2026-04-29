package com.aprovati.flashcard.controller;

import com.aprovati.flashcard.dto.FlashcardDTO;
import com.aprovati.flashcard.dto.FlashcardReviewRequest;
import com.aprovati.flashcard.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    @GetMapping("/disciplinas")
    public ResponseEntity<List<String>> listarDisciplinas() {
        return ResponseEntity.ok(flashcardService.listarDisciplinasVisiveis());
    }

    @GetMapping
    public ResponseEntity<List<FlashcardDTO>> listar(
            @RequestParam(required = false) String disciplina,
            @RequestParam(required = false) String origem
    ) {
        return ResponseEntity.ok(flashcardService.listarFlashcards(disciplina, origem));
    }

    @GetMapping("/revisao/pendentes")
    public ResponseEntity<List<FlashcardDTO>> listarPendentes(
            @RequestParam(required = false) String disciplina,
            @RequestParam(required = false) String origem
    ) {
        return ResponseEntity.ok(flashcardService.listarPendentesHoje(disciplina, origem));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<FlashcardDTO> criar(
            @RequestParam String disciplina,
            @RequestParam String frente,
            @RequestParam String verso,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem
    ) {
        return ResponseEntity.ok(flashcardService.criarPessoal(disciplina, frente, verso, imagem));
    }

    @PutMapping(value = "/{flashcardId}", consumes = "multipart/form-data")
    public ResponseEntity<FlashcardDTO> atualizar(
            @PathVariable Long flashcardId,
            @RequestParam String disciplina,
            @RequestParam String frente,
            @RequestParam String verso,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem
    ) {
        return ResponseEntity.ok(flashcardService.atualizarPessoal(flashcardId, disciplina, frente, verso, imagem));
    }

    @DeleteMapping("/{flashcardId}")
    public ResponseEntity<Void> remover(@PathVariable Long flashcardId) {
        flashcardService.removerPessoal(flashcardId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{flashcardId}/revisao")
    public ResponseEntity<FlashcardDTO> revisar(
            @PathVariable Long flashcardId,
            @RequestBody FlashcardReviewRequest request
    ) {
        return ResponseEntity.ok(flashcardService.registrarRevisao(flashcardId, request.getResultado()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidation(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensagem", ex.getMessage()));
    }
}
