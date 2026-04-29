package com.aprovati.admin.controller;

import com.aprovati.admin.dto.ImportConfirmRequestDTO;
import com.aprovati.admin.dto.ImportPreviewDTO;
import com.aprovati.admin.dto.ImportSummaryDTO;
import com.aprovati.admin.service.QuestaoImportService;
import com.aprovati.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/importacoes")
@RequiredArgsConstructor
public class AdminImportController {

    private final QuestaoImportService questaoImportService;
    private final AuditService auditService;

    @PostMapping(value = "/provas/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportPreviewDTO> previewProva(
            @RequestParam("provaPdf") MultipartFile provaPdf,
            @RequestParam("gabaritoPdf") MultipartFile gabaritoPdf,
            @RequestParam(required = false) String banca,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String fonteProva
    ) {
        ImportPreviewDTO preview = questaoImportService.gerarPreview(provaPdf, gabaritoPdf, banca, ano, fonteProva);
        auditService.log("ADMIN_IMPORT_PREVIEW_PDF", "IMPORTACAO", "totalExtraidas=" + preview.getTotalExtraidas());
        return ResponseEntity.ok(preview);
    }

    @PostMapping(value = "/csv/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportPreviewDTO> previewCsv(
            @RequestParam("csvFile") MultipartFile csvFile
    ) {
        ImportPreviewDTO preview = questaoImportService.gerarPreviewCsv(csvFile);
        auditService.log("ADMIN_IMPORT_PREVIEW_CSV", "IMPORTACAO", "totalExtraidas=" + preview.getTotalExtraidas());
        return ResponseEntity.ok(preview);
    }

    @PostMapping(value = "/provas/confirm", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ImportSummaryDTO> confirmarImportacao(@RequestBody ImportConfirmRequestDTO request) {
        ImportSummaryDTO summary = questaoImportService.confirmarImportacao(
                request.getQuestoes(),
                request.isPermitirDuplicadas()
        );
        auditService.log(
                "ADMIN_IMPORT_CONFIRM",
                "IMPORTACAO",
                "totalImportadas=" + summary.getTotalImportadas() + ", permitirDuplicadas=" + request.isPermitirDuplicadas()
        );
        return ResponseEntity.ok(summary);
    }

    @PostMapping(value = "/provas", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportSummaryDTO> importarProva(
            @RequestParam("provaPdf") MultipartFile provaPdf,
            @RequestParam("gabaritoPdf") MultipartFile gabaritoPdf,
            @RequestParam(required = false) String banca,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String fonteProva
    ) {
        ImportSummaryDTO summary = questaoImportService.importar(provaPdf, gabaritoPdf, banca, ano, fonteProva);
        return ResponseEntity.ok(summary);
    }
}
