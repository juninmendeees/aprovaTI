package com.aprovati.billing.exception;

import lombok.Getter;

@Getter
public class SubscriptionAccessException extends RuntimeException {
    private final String code;

    public SubscriptionAccessException(String code, String message) {
        super(message);
        this.code = code;
    }
}
