package com.aprovati.config;

import com.aprovati.entity.UserRole;
import com.aprovati.entity.Usuario;
import com.aprovati.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.bootstrap-enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.name:}")
    private String adminName;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (!bootstrapEnabled) {
            return;
        }

        if (adminEmail == null || adminEmail.isBlank()
                || adminName == null || adminName.isBlank()
                || adminPassword == null || adminPassword.isBlank()) {
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        boolean exists = usuarioRepository.existsByEmailIgnoreCase(normalizedEmail);
        if (exists) {
            return;
        }

        Usuario admin = Usuario.builder()
                .email(normalizedEmail)
                .nome(adminName.trim())
                .role(UserRole.ADMIN)
                .senha(passwordEncoder.encode(adminPassword))
                .build();
        usuarioRepository.save(admin);
    }
}
