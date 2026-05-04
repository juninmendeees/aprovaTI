package com.aprovati.service;

import com.aprovati.entity.Questao;
import com.aprovati.repository.QuestaoRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestaoEnunciadoImagemService {

    private static final int MAX_BYTES = 2 * 1024 * 1024;

    private final QuestaoRepository questaoRepository;

    @Value("${app.questoes.enunciado-imagem-dir:./data/questoes-enunciado-imagens}")
    private String storageDir;

    private Path basePath;

    @PostConstruct
    void init() throws IOException {
        basePath = Path.of(storageDir).toAbsolutePath().normalize();
        Files.createDirectories(basePath);
    }

    public void attachBase64IfPresent(Questao questao, String base64OrDataUrl) {
        if (questao == null || questao.getId() == null) {
            throw new IllegalStateException("Questão inválida para anexar imagem");
        }
        String raw = normalizeBase64Input(base64OrDataUrl);
        if (raw.isBlank()) {
            return;
        }

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(raw);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Imagem em Base64 inválida.");
        }

        if (decoded.length == 0) {
            throw new IllegalStateException("Imagem vazia.");
        }
        if (decoded.length > MAX_BYTES) {
            throw new IllegalStateException("Imagem muito grande (máximo 2 MB).");
        }

        String ext = detectExtension(decoded);
        if (ext == null) {
            throw new IllegalStateException("Formato de imagem não suportado. Use PNG, JPEG, GIF ou WebP.");
        }

        Path target = filePathFor(questao.getId(), ext);
        try {
            Files.write(target, decoded);
        } catch (IOException ex) {
            throw new IllegalStateException("Não foi possível salvar a imagem: " + ex.getMessage());
        }

        questao.setEnunciadoImagemExt(ext);
        questaoRepository.save(questao);
    }

    public Optional<LoadedEnunciadoImagem> load(Long questaoId) {
        if (questaoId == null) {
            return Optional.empty();
        }
        Questao q = questaoRepository.findById(questaoId).orElse(null);
        if (q == null || q.getEnunciadoImagemExt() == null || q.getEnunciadoImagemExt().isBlank()) {
            return Optional.empty();
        }
        String ext = q.getEnunciadoImagemExt().trim().toLowerCase(Locale.ROOT);
        Path path = filePathFor(questaoId, ext);
        if (!Files.isRegularFile(path)) {
            return Optional.empty();
        }
        try {
            byte[] bytes = Files.readAllBytes(path);
            return Optional.of(new LoadedEnunciadoImagem(bytes, mediaTypeForExt(ext)));
        } catch (IOException ex) {
            return Optional.empty();
        }
    }

    public void deleteIfExists(Long questaoId) {
        if (questaoId == null || basePath == null) {
            return;
        }
        Questao q = questaoRepository.findById(questaoId).orElse(null);
        String ext = q != null && q.getEnunciadoImagemExt() != null ? q.getEnunciadoImagemExt().trim() : "";
        if (!ext.isEmpty()) {
            try {
                Files.deleteIfExists(filePathFor(questaoId, ext.toLowerCase(Locale.ROOT)));
            } catch (IOException ignored) {
            }
        }
    }

    private Path filePathFor(Long id, String ext) {
        String safeExt = ext.replaceAll("[^a-z0-9]", "");
        return basePath.resolve(id + "." + safeExt);
    }

    private static String normalizeBase64Input(String input) {
        if (input == null) {
            return "";
        }
        String s = input.trim();
        int comma = s.indexOf(',');
        if (s.startsWith("data:") && comma > 0) {
            s = s.substring(comma + 1).trim();
        }
        return s.replaceAll("\\s+", "");
    }

    private static String detectExtension(byte[] data) {
        if (data.length >= 8
                && data[0] == (byte) 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47
                && data[4] == 0x0D && data[5] == 0x0A && data[6] == 0x1A && data[7] == 0x0A) {
            return "png";
        }
        if (data.length >= 3
                && (data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8 && (data[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (data.length >= 6
                && data[0] == 'G' && data[1] == 'I' && data[2] == 'F' && data[3] == '8'
                && (data[4] == '7' || data[4] == '9') && data[5] == 'a') {
            return "gif";
        }
        if (data.length >= 12
                && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
                && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') {
            return "webp";
        }
        return null;
    }

    private static MediaType mediaTypeForExt(String ext) {
        return switch (ext.toLowerCase(Locale.ROOT)) {
            case "png" -> MediaType.IMAGE_PNG;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "webp" -> MediaType.parseMediaType("image/webp");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    public record LoadedEnunciadoImagem(byte[] bytes, MediaType mediaType) {
    }
}
