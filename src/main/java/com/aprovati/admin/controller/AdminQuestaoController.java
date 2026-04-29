package com.aprovati.admin.controller;

import com.aprovati.admin.dto.DuplicateCheckResponseDTO;
import com.aprovati.admin.dto.ImportedQuestaoDTO;
import com.aprovati.admin.dto.ManualQuestaoCreateRequestDTO;
import com.aprovati.admin.service.QuestaoImportService;
import com.aprovati.audit.service.AuditService;
import com.aprovati.entity.Questao;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/questoes")
@RequiredArgsConstructor
public class AdminQuestaoController {

    private final QuestaoImportService questaoImportService;
    private final AuditService auditService;

    @PostMapping("/validar-duplicidade")
    public ResponseEntity<DuplicateCheckResponseDTO> validarDuplicidade(@RequestBody ImportedQuestaoDTO questao) {
        QuestaoImportService.DuplicateCheckResult result = questaoImportService.validarDuplicidade(questao);
        if (result.duplicada()) {
            auditService.log(
                    "ADMIN_DUPLICATE_CHECK",
                    "QUESTAO",
                    "Duplicate found: id=" + result.idQuestao()
            );
        }
        return ResponseEntity.ok(DuplicateCheckResponseDTO.builder()
                .duplicada(result.duplicada())
                .idQuestao(result.idQuestao())
                .enunciado(result.enunciado())
                .build());
    }

    @PostMapping("/manual")
    public ResponseEntity<Map<String, Object>> criarManual(@RequestBody ManualQuestaoCreateRequestDTO request) {
        try {
            Questao saved = questaoImportService.salvarQuestaoManual(
                    request.getQuestao(),
                    request.isConfirmarDuplicada()
            );
            auditService.log(
                    "ADMIN_MANUAL_CREATE",
                    "QUESTAO",
                    "Questao criada id=" + saved.getId() + ", confirmarDuplicada=" + request.isConfirmarDuplicada()
            );

            return ResponseEntity.ok(Map.of(
                    "id", saved.getId(),
                    "mensagem", "Questão cadastrada com sucesso."
            ));
        } catch (IllegalArgumentException ex) {
            auditService.log(
                    "ADMIN_MANUAL_CREATE_REJECTED",
                    "QUESTAO",
                    ex.getMessage()
            );
            return ResponseEntity.status(409).body(Map.of(
                    "mensagem", ex.getMessage()
            ));
        }
    }
}
