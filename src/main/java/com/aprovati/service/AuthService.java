package com.aprovati.service;

import com.aprovati.dto.AuthResponse;
import com.aprovati.dto.LoginRequest;
import com.aprovati.dto.RegisterRequest;
import com.aprovati.entity.SubscriptionStatus;
import com.aprovati.entity.UserRole;
import com.aprovati.entity.Usuario;
import com.aprovati.repository.UsuarioRepository;
import com.aprovati.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${app.admin.email:}")
    private String adminEmail;
    @Value("${app.billing.trial-days:7}")
    private int trialDays;

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (usuarioRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }

        UserRole role = isAdminEmail(normalizedEmail) ? UserRole.ADMIN : UserRole.USER;

        Usuario usuario = Usuario.builder()
                .nome(request.getNome().trim())
                .email(normalizedEmail)
                .senha(passwordEncoder.encode(request.getSenha()))
                .role(role)
                .subscriptionStatus(role == UserRole.ADMIN ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIALING)
                .subscriptionTrialEndsAt(role == UserRole.ADMIN ? null : LocalDateTime.now().plusDays(Math.max(trialDays, 0)))
                .build();

        Usuario salvo = usuarioRepository.save(usuario);
        String token = jwtService.generateToken(
                org.springframework.security.core.userdetails.User.builder()
                        .username(salvo.getEmail())
                        .password(salvo.getSenha())
                        .roles(salvo.getRole().name())
                        .build(),
                salvo.getRole().name()
        );

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .id(salvo.getId())
                .nome(salvo.getNome())
                .email(salvo.getEmail())
                .role(salvo.getRole().name())
                .subscriptionStatus(salvo.getSubscriptionStatus())
                .subscriptionPlanCode(salvo.getSubscriptionPlanCode())
                .subscriptionTrialEndsAt(salvo.getSubscriptionTrialEndsAt())
                .subscriptionCurrentPeriodEndsAt(salvo.getSubscriptionCurrentPeriodEndsAt())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getSenha())
        );

        Usuario usuario = usuarioRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        String token = jwtService.generateToken(
                org.springframework.security.core.userdetails.User.builder()
                        .username(usuario.getEmail())
                        .password(usuario.getSenha())
                        .roles(usuario.getRole().name())
                        .build(),
                usuario.getRole().name()
        );

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .role(usuario.getRole().name())
                .subscriptionStatus(usuario.getSubscriptionStatus())
                .subscriptionPlanCode(usuario.getSubscriptionPlanCode())
                .subscriptionTrialEndsAt(usuario.getSubscriptionTrialEndsAt())
                .subscriptionCurrentPeriodEndsAt(usuario.getSubscriptionCurrentPeriodEndsAt())
                .build();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail é obrigatório");
        }
        return email.trim().toLowerCase();
    }

    private boolean isAdminEmail(String normalizedEmail) {
        return adminEmail != null
                && !adminEmail.isBlank()
                && normalizedEmail.equalsIgnoreCase(adminEmail.trim());
    }
}
