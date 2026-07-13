package com.devvault.backend.controller;

import com.devvault.backend.dto.GameStatsDto;
import com.devvault.backend.entity.GameHistory;
import com.devvault.backend.service.GameHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/games")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GameController {

    private static final Logger logger = LoggerFactory.getLogger(GameController.class);

    @Autowired
    private GameHistoryService gameHistoryService;

    /**
     * POST /games/start
     * Logs or initiates a game session.
     */
    @PostMapping("/start")
    public ResponseEntity<?> startGame(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        logger.info("Initializing game session for player: {}", email);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "initialized");
        response.put("message", "Game session successfully started!");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /games/history
     * Saves completed game result.
     */
    @PostMapping("/history")
    public ResponseEntity<?> saveHistory(@RequestBody GameHistory history) {
        logger.info("Saving game history. Mode: {}, Winner: {}, Duration: {}s", 
                history.getGameMode(), history.getWinner(), history.getDuration());
        try {
            GameHistory saved = gameHistoryService.saveGameHistory(history);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid game history payload: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error saving game history", e);
            return ResponseEntity.status(500).body("Error saving game history: " + e.getMessage());
        }
    }

    /**
     * GET /games/history/{email}
     * Retrieves all completed games for a user.
     */
    @GetMapping("/history/{email}")
    public ResponseEntity<?> getHistory(@PathVariable String email) {
        logger.info("Retrieving game history for user: {}", email);
        try {
            List<GameHistory> history = gameHistoryService.getGameHistoryByEmail(email);
            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error retrieving game history for {}", email, e);
            return ResponseEntity.status(500).body("Error retrieving history: " + e.getMessage());
        }
    }

    /**
     * DELETE /games/history/{id}
     * Deletes a game history record by ID.
     */
    @DeleteMapping("/history/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id) {
        logger.info("Deleting game history record: {}", id);
        try {
            gameHistoryService.deleteGameHistory(id);
            return ResponseEntity.ok("Successfully deleted game history record!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error deleting game history record {}", id, e);
            return ResponseEntity.status(500).body("Error deleting record: " + e.getMessage());
        }
    }

    /**
     * GET /games/stats/{email}
     * Retrieves computed player statistics.
     */
    @GetMapping("/stats/{email}")
    public ResponseEntity<?> getStats(@PathVariable String email) {
        logger.info("Retrieving game statistics for user: {}", email);
        try {
            GameStatsDto stats = gameHistoryService.getGameStatsByEmail(email);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error computing game stats for {}", email, e);
            return ResponseEntity.status(500).body("Error computing stats: " + e.getMessage());
        }
    }
}
