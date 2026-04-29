package com.aprovati.billing.dto;

import com.aprovati.entity.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

public class BillingDtos {

    @Data
    @Builder
    public static class SubscriptionStatusResponse {
        private String customerId;
        private String subscriptionId;
        private SubscriptionStatus status;
        private String planCode;
        private LocalDateTime trialEndsAt;
        private LocalDateTime currentPeriodEndsAt;
        private boolean requiresSubscription;
        private boolean canAccessApp;
    }

    @Data
    public static class CheckoutRequest {
        private String planCode;
    }

    @Data
    @Builder
    public static class CheckoutResponse {
        private String checkoutUrl;
    }

    @Data
    @Builder
    public static class PortalResponse {
        private String portalUrl;
    }
}
