package com.aprovati.admin.controller;

import com.aprovati.apostila.dto.AdminApostilaRequests;
import com.aprovati.apostila.dto.ApostilaDisciplinaCatalogoDTO;
import com.aprovati.apostila.service.ApostilaCatalogoService;
import com.aprovati.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/apostilas")
@RequiredArgsConstructor
public class AdminApostilaController {

    private final ApostilaCatalogoService apostilaCatalogoService;
    private final AuditService auditService;

    @GetMapping("/catalogo")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> listarCatalogo() {
        return ResponseEntity.ok(apostilaCatalogoService.listarCatalogo());
    }

    @GetMapping("/sugestoes/disciplinas")
    public ResponseEntity<List<String>> listarDisciplinasSugeridas() {
        return ResponseEntity.ok(apostilaCatalogoService.listarDisciplinasSugeridas());
    }

    @PostMapping("/disciplinas")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> criarDisciplina(
            @RequestBody AdminApostilaRequests.CreateDisciplinaRequest request
    ) {
        List<ApostilaDisciplinaCatalogoDTO> catalogo = apostilaCatalogoService.criarDisciplina(request.getNome());
        auditService.log("ADMIN_APOSTILA_CREATE_DISCIPLINA", "APOSTILA", "nome=" + request.getNome());
        return ResponseEntity.ok(catalogo);
    }

    @DeleteMapping("/disciplinas/{disciplinaId}")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> removerDisciplina(@PathVariable Long disciplinaId) {
        List<ApostilaDisciplinaCatalogoDTO> catalogo = apostilaCatalogoService.removerDisciplina(disciplinaId);
        auditService.log("ADMIN_APOSTILA_DELETE_DISCIPLINA", "APOSTILA", "disciplinaId=" + disciplinaId);
        return ResponseEntity.ok(catalogo);
    }

    @PostMapping("/assuntos")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> criarAssunto(
            @RequestBody AdminApostilaRequests.CreateAssuntoRequest request
    ) {
        List<ApostilaDisciplinaCatalogoDTO> catalogo = apostilaCatalogoService.criarAssunto(
                request.getDisciplinaId(),
                request.getNome()
        );
        auditService.log(
                "ADMIN_APOSTILA_CREATE_ASSUNTO",
                "APOSTILA",
                "disciplinaId=" + request.getDisciplinaId() + ", nome=" + request.getNome()
        );
        return ResponseEntity.ok(catalogo);
    }

    @DeleteMapping("/assuntos/{assuntoId}")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> removerAssunto(@PathVariable Long assuntoId) {
        List<ApostilaDisciplinaCatalogoDTO> catalogo = apostilaCatalogoService.removerAssunto(assuntoId);
        auditService.log("ADMIN_APOSTILA_DELETE_ASSUNTO", "APOSTILA", "assuntoId=" + assuntoId);
        return ResponseEntity.ok(catalogo);
    }

    @PostMapping("/arquivos")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> criarArquivo(
            @RequestBody AdminApostilaRequests.CreateArquivoRequest request
    ) {
        List<ApostilaDisciplinaCatalogoDTO> catalogo = apostilaCatalogoService.criarArquivo(request);
        auditService.log(
                "ADMIN_APOSTILA_CREATE_ARQUIVO",
                "APOSTILA",
                "assuntoId=" + request.getAssuntoId() + ", titulo=" + request.getTitulo()
        );
        return ResponseEntity.ok(catalogo);
    }

    @PostMapping("/arquivos/upload")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> uploadArquivo(
            @RequestParam Long assuntoId,
            @RequestParam String titulo,
            @RequestParam(required = false) Integer paginas,
            @RequestPart("arquivoPdf") MultipartFile arquivoPdf
    ) {
        List<ApostilaDisciplinaCatalogoDTO> catalogo = apostilaCatalogoService.criarArquivoUpload(
                assuntoId,
                titulo,
                paginas,
                arquivoPdf
        );
        auditService.log(
                "ADMIN_APOSTILA_UPLOAD_ARQUIVO",
                "APOSTILA",
                "assuntoId=" + assuntoId + ", titulo=" + titulo + ", file=" + arquivoPdf.getOriginalFilename()
        );
        return ResponseEntity.ok(catalogo);
    }

    @PutMapping("/arquivos/{arquivoId}")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> atualizarArquivo(
            @PathVariable Long arquivoId,
            @RequestBody AdminApostilaRequests.UpdateArquivoRequest request
    ) {
        List<ApostilaDisciplinaCatalogoDTO> catalogo = apostilaCatalogoService.atualizarArquivo(arquivoId, request);
        auditService.log(
                "ADMIN_APOSTILA_UPDATE_ARQUIVO",
                "APOSTILA",
                "arquivoId=" + arquivoId + ", titulo=" + request.getTitulo()
        );
        return ResponseEntity.ok(catalogo);
    }

    @DeleteMapping("/arquivos/{arquivoId}")
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> removerArquivo(@PathVariable Long arquivoId) {
        List<ApostilaDisciplinaCatalogoDTO> catalogo = apostilaCatalogoService.removerArquivo(arquivoId);
        auditService.log("ADMIN_APOSTILA_DELETE_ARQUIVO", "APOSTILA", "arquivoId=" + arquivoId);
        return ResponseEntity.ok(catalogo);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidation(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensagem", ex.getMessage()));
    }
}
