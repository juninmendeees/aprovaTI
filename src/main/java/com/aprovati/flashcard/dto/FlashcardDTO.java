package com.aprovati.flashcard.dto;

import com.aprovati.flashcard.entity.FlashcardOrigem;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class FlashcardDTO {
    private Long id;
    private String disciplina;
    private String frente;
    private String verso;
    private FlashcardOrigem origem;
    private Long ownerUsuarioId;
    private String imagemDataUrl;
    private Integer etapaRevisao;
    private Integer intervaloDias;
    private LocalDate proximaRevisao;
    private LocalDateTime ultimaRevisao;
    private Integer totalRevisoes;
    private boolean pendenteHoje;
}
