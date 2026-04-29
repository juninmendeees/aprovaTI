package com.aprovati.admin.controller;

import com.aprovati.audit.service.AuditRetentionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/retencao")
@RequiredArgsConstructor
public class AdminRetentionController {

    private final AuditRetentionService auditRetentionService;

    @PostMapping("/auditoria/executar")
    public ResponseEntity<AuditRetentionService.RetentionResult> executarRetencaoAuditoria() {
        return ResponseEntity.ok(auditRetentionService.executeCleanup());
    }
}
