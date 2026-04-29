package com.aprovati.billing.service;

import com.aprovati.billing.exception.SubscriptionAccessException;
import com.aprovati.entity.SubscriptionStatus;
import com.aprovati.entity.UserRole;
import com.aprovati.entity.Usuario;
import com.aprovati.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SubscriptionAccessService {

    private final UsuarioRepository usuarioRepository;

    @Transactional
    public void assertPathAllowed(String email, String path) {
        Usuario user = usuarioRepository.findByEmailIgnoreCase(email)
                .orElse(null);
        if (user == null || user.getRole() == UserRole.ADMIN) {
            return;
        }

        refreshTrialIfExpired(user);
        boolean active = isActiveOrTrialing(user);

        if (active && user.getSubscriptionStatus() == SubscriptionStatus.TRIALING) {
            if (path.startsWith("/flashcards") || path.startsWith("/mapas-mentais")) {
                throw new SubscriptionAccessException(
                        "TRIAL_FEATURE_LOCKED",
                        "Seu período de teste permite apostilas e 10 questões por dia. Assine para liberar este módulo."
                );
            }
            return;
        }

        if (!active) {
            if (path.startsWith("/dashboard") || path.startsWith("/billing")) {
                return;
            }
            throw new SubscriptionAccessException(
                    "SUBSCRIPTION_REQUIRED",
                    "Seu período de teste expirou. Assine um plano para continuar usando os módulos."
            );
        }
    }

    @Transactional
    public void refreshTrialIfExpired(Usuario user) {
        if (user.getSubscriptionStatus() == SubscriptionStatus.TRIALING
                && user.getSubscriptionTrialEndsAt() != null
                && LocalDateTime.now().isAfter(user.getSubscriptionTrialEndsAt())) {
            user.setSubscriptionStatus(SubscriptionStatus.CANCELED);
            usuarioRepository.save(user);
        }
    }

    public boolean isActiveOrTrialing(Usuario user) {
        return user.getSubscriptionStatus() == SubscriptionStatus.ACTIVE
                || user.getSubscriptionStatus() == SubscriptionStatus.TRIALING;
    }
}
