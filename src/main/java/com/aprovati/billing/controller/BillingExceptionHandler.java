package com.aprovati.billing.controller;

import com.aprovati.billing.exception.SubscriptionAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class BillingExceptionHandler {

    @ExceptionHandler(SubscriptionAccessException.class)
    public ResponseEntity<Map<String, String>> handleSubscriptionAccess(SubscriptionAccessException ex) {
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .body(Map.of(
                        "code", ex.getCode(),
                        "mensagem", ex.getMessage()
                ));
    }
}
