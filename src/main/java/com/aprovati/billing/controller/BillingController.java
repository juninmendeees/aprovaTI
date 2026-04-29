package com.aprovati.billing.controller;

import com.aprovati.billing.dto.BillingDtos;
import com.aprovati.billing.service.StripeBillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/billing")
@RequiredArgsConstructor
public class BillingController {

    private final StripeBillingService stripeBillingService;

    @GetMapping("/me")
    public ResponseEntity<BillingDtos.SubscriptionStatusResponse> mySubscription() {
        return ResponseEntity.ok(stripeBillingService.mySubscription());
    }

    @PostMapping("/checkout-session")
    public ResponseEntity<BillingDtos.CheckoutResponse> checkout(
            @RequestBody BillingDtos.CheckoutRequest request
    ) {
        return ResponseEntity.ok(stripeBillingService.createCheckout(request.getPlanCode()));
    }

    @PostMapping("/portal-session")
    public ResponseEntity<BillingDtos.PortalResponse> portal() {
        return ResponseEntity.ok(stripeBillingService.createPortalSession());
    }

    @PostMapping("/cancel")
    public ResponseEntity<Void> cancel() {
        stripeBillingService.cancelAtPeriodEnd();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reactivate")
    public ResponseEntity<Void> reactivate() {
        stripeBillingService.reactivate();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String payload) {
        stripeBillingService.processWebhook(payload);
        return ResponseEntity.ok().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidation(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensagem", ex.getMessage()));
    }
}
