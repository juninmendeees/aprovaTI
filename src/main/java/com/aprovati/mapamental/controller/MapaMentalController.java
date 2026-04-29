package com.aprovati.mapamental.controller;

import com.aprovati.mapamental.dto.MapaMentalDTO;
import com.aprovati.mapamental.service.MapaMentalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mapas-mentais")
@RequiredArgsConstructor
public class MapaMentalController {

    private final MapaMentalService mapaMentalService;

    @GetMapping("/disciplinas")
    public ResponseEntity<List<String>> listarDisciplinas() {
        return ResponseEntity.ok(mapaMentalService.listarDisciplinas());
    }

    @GetMapping
    public ResponseEntity<List<MapaMentalDTO>> listar(
            @RequestParam(required = false) String disciplina,
            @RequestParam(required = false) String assunto
    ) {
        return ResponseEntity.ok(mapaMentalService.listar(disciplina, assunto));
    }
}
