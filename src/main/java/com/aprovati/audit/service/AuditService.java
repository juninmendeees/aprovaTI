package com.aprovati.audit.service;

import com.aprovati.audit.entity.AuditEvent;
import com.aprovati.audit.repository.AuditEventRepository;
import com.aprovati.entity.Usuario;
import com.aprovati.security.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public void log(String action, String resource, String details) {
        Usuario actor = authenticatedUserService.getCurrentUsuario();
        auditEventRepository.save(
                AuditEvent.builder()
                        .actorUserId(actor.getId())
                        .actorEmail(actor.getEmail())
                        .action(action)
                        .resource(resource)
                        .details(details)
                        .createdAt(LocalDateTime.now())
                        .build()
        );
    }
}
