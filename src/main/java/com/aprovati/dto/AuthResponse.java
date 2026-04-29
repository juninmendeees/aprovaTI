package com.aprovati.dto;

import com.aprovati.entity.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String tokenType;
    private Long id;
    private String nome;
    private String email;
    private String role;
    private SubscriptionStatus subscriptionStatus;
    private String subscriptionPlanCode;
    private LocalDateTime subscriptionTrialEndsAt;
    private LocalDateTime subscriptionCurrentPeriodEndsAt;
}
