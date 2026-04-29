package com.aprovati.policy.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/politicas")
public class PolicyController {

    @Value("${app.retention.audit-days:90}")
    private int auditRetentionDays;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPoliticas() {
        return ResponseEntity.ok(Map.of(
                "retencao", Map.of(
                        "auditoriaDias", auditRetentionDays,
                        "logsAplicacaoDias", 30,
                        "dadosEstudo", "enquanto conta ativa",
                        "exclusaoSolicitadaDias", 30
                ),
                "baseLegal", "LGPD",
                "praticas", List.of(
                        "Dados de estudo individualizados por usuário",
                        "Acesso controlado por autenticação JWT",
                        "Limpeza periódica de auditoria vencida",
                        "Sem armazenamento de dados sensíveis de cartão no aplicativo"
                )
        ));
    }
}
