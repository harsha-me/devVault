package com.devvault.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Lightweight liveness endpoint used to keep the Render free-tier instance warm
 * and to let the frontend pre-warm the backend without touching the database.
 * Deliberately does no DB/service work so it responds instantly even while
 * everything else is still spinning up.
 */
@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "timestamp", System.currentTimeMillis());
    }
}
