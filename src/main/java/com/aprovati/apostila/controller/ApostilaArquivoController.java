package com.aprovati.apostila.controller;

import com.aprovati.apostila.entity.ApostilaArquivo;
import com.aprovati.apostila.service.ApostilaCatalogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/apostilas/arquivos")
@RequiredArgsConstructor
public class ApostilaArquivoController {

    private static final long CHUNK_SIZE = 1024 * 1024;
    private final ApostilaCatalogoService apostilaCatalogoService;

    @GetMapping("/{arquivoId}/conteudo")
    public ResponseEntity<?> lerConteudo(
            @PathVariable Long arquivoId,
            @RequestHeader HttpHeaders headers
    ) {
        try {
            ApostilaArquivo arquivo = apostilaCatalogoService.buscarArquivo(arquivoId);
            Path path = apostilaCatalogoService.resolverArquivoStorage(arquivo);
            if (!Files.exists(path)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Arquivo não encontrado.");
            }

            Resource resource = new UrlResource(path.toUri());
            long contentLength = resource.contentLength();
            List<HttpRange> ranges = headers.getRange();

            if (ranges == null || ranges.isEmpty()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"apostila-" + arquivoId + ".pdf\"")
                        .contentLength(contentLength)
                        .body(resource);
            }

            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long rangeLength = Math.min(CHUNK_SIZE, end - start + 1);
            ResourceRegion region = new ResourceRegion(resource, start, rangeLength);

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(region);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Arquivo não disponível.");
        }
    }
}
