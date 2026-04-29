package com.aprovati.audit.repository;

import com.aprovati.audit.entity.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    long countByCreatedAtBefore(LocalDateTime cutoff);

    long deleteByCreatedAtBefore(LocalDateTime cutoff);
}
