package com.aprovati.audit.service;

import com.aprovati.audit.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditRetentionService {

    private final AuditEventRepository auditEventRepository;

    @Value("${app.retention.audit-days:90}")
    private int auditDays;

    public RetentionResult executeCleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(Math.max(1, auditDays));
        long before = auditEventRepository.countByCreatedAtBefore(cutoff);
        long deleted = auditEventRepository.deleteByCreatedAtBefore(cutoff);
        return new RetentionResult(cutoff.toString(), before, deleted, auditDays);
    }

    @Scheduled(cron = "0 15 3 * * *")
    public void scheduledCleanup() {
        RetentionResult result = executeCleanup();
        if (result.deleted() > 0) {
            log.info("Audit retention cleanup executed: {}", result);
        } else {
            log.debug("Audit retention cleanup executed: {}", result);
        }
    }

    public record RetentionResult(String cutoffIso, long eligible, long deleted, int retentionDays) {
    }
}
