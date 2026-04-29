package com.aprovati.apostila.controller;

import com.aprovati.apostila.dto.ApostilaDisciplinaCatalogoDTO;
import com.aprovati.apostila.service.ApostilaCatalogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/apostilas/catalogo")
@RequiredArgsConstructor
public class ApostilaCatalogoController {

    private final ApostilaCatalogoService apostilaCatalogoService;

    @GetMapping
    public ResponseEntity<List<ApostilaDisciplinaCatalogoDTO>> listarCatalogo() {
        return ResponseEntity.ok(apostilaCatalogoService.listarCatalogo());
    }
}
