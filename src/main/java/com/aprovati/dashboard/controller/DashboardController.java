package com.aprovati.dashboard.controller;

import com.aprovati.dashboard.service.DashboardService;
import com.aprovati.security.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping("/me")
    public Map<String, Object> getDashboardMe() {
        return service.getDashboard(authenticatedUserService.getCurrentUsuario().getId());
    }
}