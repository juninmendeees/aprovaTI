package com.aprovati.billing.service;

import com.aprovati.billing.dto.BillingDtos;
import com.aprovati.entity.SubscriptionStatus;
import com.aprovati.entity.UserRole;
import com.aprovati.entity.Usuario;
import com.aprovati.repository.UsuarioRepository;
import com.aprovati.security.AuthenticatedUserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StripeBillingService {

    private final UsuarioRepository usuarioRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final SubscriptionAccessService subscriptionAccessService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.billing.enabled:false}")
    private boolean billingEnabled;
    @Value("${app.billing.stripe.secret-key:}")
    private String stripeSecretKey;
    @Value("${app.billing.stripe.webhook-secret:}")
    private String stripeWebhookSecret;
    @Value("${app.billing.success-url:http://localhost:5173/app/minha-assinatura?checkout=success}")
    private String successUrl;
    @Value("${app.billing.cancel-url:http://localhost:5173/app/minha-assinatura?checkout=cancel}")
    private String cancelUrl;
    @Value("${app.billing.portal-return-url:http://localhost:5173/app/minha-assinatura}")
    private String portalReturnUrl;
    @Value("${app.billing.trial-days:7}")
    private int trialDays;
    @Value("${app.billing.stripe.prices.essencial:}")
    private String priceEssencialMensal;
    @Value("${app.billing.stripe.prices.essencial-anual:}")
    private String priceEssencialAnual;
    @Value("${app.billing.stripe.prices.pro:}")
    private String priceProMensal;
    @Value("${app.billing.stripe.prices.pro-anual:}")
    private String priceProAnual;
    @Value("${app.billing.stripe.prices.premium:}")
    private String pricePremiumMensal;
    @Value("${app.billing.stripe.prices.premium-anual:}")
    private String pricePremiumAnual;

    @Transactional(readOnly = true)
    public BillingDtos.SubscriptionStatusResponse mySubscription() {
        Usuario user = authenticatedUserService.getCurrentUsuario();
        subscriptionAccessService.refreshTrialIfExpired(user);
        boolean requiresSubscription = user.getRole() != UserRole.ADMIN;
        boolean canAccess = !requiresSubscription || isActiveOrTrialing(user.getSubscriptionStatus());
        return BillingDtos.SubscriptionStatusResponse.builder()
                .customerId(user.getStripeCustomerId())
                .subscriptionId(user.getStripeSubscriptionId())
                .status(user.getSubscriptionStatus())
                .planCode(user.getSubscriptionPlanCode())
                .trialEndsAt(user.getSubscriptionTrialEndsAt())
                .currentPeriodEndsAt(user.getSubscriptionCurrentPeriodEndsAt())
                .requiresSubscription(requiresSubscription)
                .canAccessApp(canAccess)
                .build();
    }

    @Transactional
    public BillingDtos.CheckoutResponse createCheckout(String planCode) {
        ensureBillingConfigured();
        Usuario user = authenticatedUserService.getCurrentUsuario();
        String customerId = ensureStripeCustomer(user);
        String priceId = resolvePriceId(planCode);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("mode", "subscription");
        params.add("success_url", successUrl);
        params.add("cancel_url", cancelUrl);
        params.add("customer", customerId);
        params.add("allow_promotion_codes", "true");
        params.add("line_items[0][price]", priceId);
        params.add("line_items[0][quantity]", "1");
        params.add("subscription_data[trial_period_days]", String.valueOf(Math.max(trialDays, 0)));
        params.add("metadata[usuarioId]", String.valueOf(user.getId()));
        params.add("metadata[planCode]", planCode.toUpperCase());

        JsonNode node = stripePost("/v1/checkout/sessions", params);
        String url = node.path("url").asText("");
        if (url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Não foi possível iniciar checkout.");
        }
        return BillingDtos.CheckoutResponse.builder().checkoutUrl(url).build();
    }

    @Transactional
    public BillingDtos.PortalResponse createPortalSession() {
        ensureBillingConfigured();
        Usuario user = authenticatedUserService.getCurrentUsuario();
        String customerId = ensureStripeCustomer(user);
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("customer", customerId);
        params.add("return_url", portalReturnUrl);
        JsonNode node = stripePost("/v1/billing_portal/sessions", params);
        String url = node.path("url").asText("");
        if (url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Não foi possível abrir portal de cobrança.");
        }
        return BillingDtos.PortalResponse.builder().portalUrl(url).build();
    }

    @Transactional
    public void cancelAtPeriodEnd() {
        ensureBillingConfigured();
        Usuario user = authenticatedUserService.getCurrentUsuario();
        if (user.getStripeSubscriptionId() == null || user.getStripeSubscriptionId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário não possui assinatura ativa.");
        }
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("cancel_at_period_end", "true");
        JsonNode node = stripePost("/v1/subscriptions/" + user.getStripeSubscriptionId(), params);
        applySubscriptionNode(user, node);
        usuarioRepository.save(user);
    }

    @Transactional
    public void reactivate() {
        ensureBillingConfigured();
        Usuario user = authenticatedUserService.getCurrentUsuario();
        if (user.getStripeSubscriptionId() == null || user.getStripeSubscriptionId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário não possui assinatura para reativar.");
        }
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("cancel_at_period_end", "false");
        JsonNode node = stripePost("/v1/subscriptions/" + user.getStripeSubscriptionId(), params);
        applySubscriptionNode(user, node);
        usuarioRepository.save(user);
    }

    @Transactional
    public void processWebhook(String payload) {
        // MVP: processa eventos por payload JSON. Em produção, validar assinatura (Stripe-Signature).
        JsonNode root = readJson(payload);
        String eventType = root.path("type").asText("");
        JsonNode dataObject = root.path("data").path("object");

        if ("checkout.session.completed".equals(eventType)) {
            String customerId = dataObject.path("customer").asText(null);
            String subscriptionId = dataObject.path("subscription").asText(null);
            String planCode = dataObject.path("metadata").path("planCode").asText(null);
            if (customerId != null) {
                usuarioRepository.findByStripeCustomerId(customerId).ifPresent(user -> {
                    user.setStripeCustomerId(customerId);
                    if (subscriptionId != null && !subscriptionId.isBlank()) {
                        user.setStripeSubscriptionId(subscriptionId);
                    }
                    if (planCode != null && !planCode.isBlank()) {
                        user.setSubscriptionPlanCode(planCode);
                    }
                    user.setSubscriptionStatus(SubscriptionStatus.TRIALING);
                    usuarioRepository.save(user);
                });
            }
            return;
        }

        if ("customer.subscription.updated".equals(eventType) || "customer.subscription.deleted".equals(eventType)) {
            String subId = dataObject.path("id").asText("");
            if (subId.isBlank()) return;
            Optional<Usuario> bySub = usuarioRepository.findByStripeSubscriptionId(subId);
            Usuario user = bySub.orElse(null);
            if (user == null) {
                String customerId = dataObject.path("customer").asText("");
                if (!customerId.isBlank()) {
                    user = usuarioRepository.findByStripeCustomerId(customerId).orElse(null);
                }
            }
            if (user == null) return;
            applySubscriptionNode(user, dataObject);
            usuarioRepository.save(user);
        }
    }

    private String ensureStripeCustomer(Usuario user) {
        if (user.getStripeCustomerId() != null && !user.getStripeCustomerId().isBlank()) {
            return user.getStripeCustomerId();
        }
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("email", user.getEmail());
        params.add("name", user.getNome());
        params.add("metadata[usuarioId]", String.valueOf(user.getId()));
        JsonNode customer = stripePost("/v1/customers", params);
        String customerId = customer.path("id").asText("");
        if (customerId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao criar cliente no Stripe.");
        }
        user.setStripeCustomerId(customerId);
        usuarioRepository.save(user);
        return customerId;
    }

    private String resolvePriceId(String planCodeRaw) {
        String planCode = planCodeRaw == null ? "" : planCodeRaw.trim().toUpperCase();
        return switch (planCode) {
            case "ESSENCIAL_MENSAL" -> requireConfig(priceEssencialMensal, "app.billing.stripe.prices.essencial");
            case "ESSENCIAL_ANUAL" -> requireConfig(priceEssencialAnual, "app.billing.stripe.prices.essencial-anual");
            case "PRO_MENSAL" -> requireConfig(priceProMensal, "app.billing.stripe.prices.pro");
            case "PRO_ANUAL" -> requireConfig(priceProAnual, "app.billing.stripe.prices.pro-anual");
            case "PREMIUM_MENSAL" -> requireConfig(pricePremiumMensal, "app.billing.stripe.prices.premium");
            case "PREMIUM_ANUAL" -> requireConfig(pricePremiumAnual, "app.billing.stripe.prices.premium-anual");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plano inválido.");
        };
    }

    private void applySubscriptionNode(Usuario user, JsonNode sub) {
        user.setStripeSubscriptionId(sub.path("id").asText(user.getStripeSubscriptionId()));
        user.setSubscriptionStatus(mapStatus(sub.path("status").asText("incomplete")));
        user.setSubscriptionCurrentPeriodEndsAt(toDateTime(sub.path("current_period_end").asLong(0)));
        user.setSubscriptionTrialEndsAt(toDateTime(sub.path("trial_end").asLong(0)));
        String priceId = sub.path("items").path("data").path(0).path("price").path("id").asText("");
        if (!priceId.isBlank()) {
            user.setSubscriptionPlanCode(resolvePlanCodeByPrice(priceId));
        }
    }

    private String resolvePlanCodeByPrice(String priceId) {
        Map<String, String> map = Map.of(
                priceEssencialMensal, "ESSENCIAL_MENSAL",
                priceEssencialAnual, "ESSENCIAL_ANUAL",
                priceProMensal, "PRO_MENSAL",
                priceProAnual, "PRO_ANUAL",
                pricePremiumMensal, "PREMIUM_MENSAL",
                pricePremiumAnual, "PREMIUM_ANUAL"
        );
        return map.getOrDefault(priceId, "CUSTOM");
    }

    private SubscriptionStatus mapStatus(String status) {
        return switch (status) {
            case "trialing" -> SubscriptionStatus.TRIALING;
            case "active" -> SubscriptionStatus.ACTIVE;
            case "past_due", "unpaid" -> SubscriptionStatus.PAST_DUE;
            case "canceled" -> SubscriptionStatus.CANCELED;
            default -> SubscriptionStatus.INCOMPLETE;
        };
    }

    private LocalDateTime toDateTime(long epochSec) {
        if (epochSec <= 0) return null;
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSec), ZoneOffset.UTC);
    }

    private JsonNode stripePost(String path, MultiValueMap<String, String> params) {
        String body = formEncode(params);
        HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.stripe.com" + path))
                .header("Authorization", "Bearer " + stripeSecretKey)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return sendAndParse(req);
    }

    private JsonNode sendAndParse(HttpRequest req) {
        try {
            HttpResponse<String> response = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String message = extractStripeError(response.body());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
            }
            return readJson(response.body());
        } catch (IOException | InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha de comunicação com Stripe.");
        }
    }

    private String formEncode(MultiValueMap<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, java.util.List<String>> e : params.entrySet()) {
            for (String v : e.getValue()) {
                if (sb.length() > 0) sb.append("&");
                sb.append(URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8));
                sb.append("=");
                sb.append(URLEncoder.encode(v, StandardCharsets.UTF_8));
            }
        }
        return sb.toString();
    }

    private JsonNode readJson(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Resposta inválida do Stripe.");
        }
    }

    private String extractStripeError(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String msg = root.path("error").path("message").asText("");
            if (!msg.isBlank()) return "Stripe: " + msg;
        } catch (Exception ignored) {
            // ignore
        }
        return "Falha na operação com Stripe.";
    }

    private void ensureBillingConfigured() {
        if (!billingEnabled) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing não habilitado neste ambiente.");
        }
        requireConfig(stripeSecretKey, "app.billing.stripe.secret-key");
    }

    private String requireConfig(String value, String key) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Configuração ausente: " + key);
        }
        return value;
    }

    private boolean isActiveOrTrialing(SubscriptionStatus status) {
        return status == SubscriptionStatus.ACTIVE || status == SubscriptionStatus.TRIALING;
    }
}
