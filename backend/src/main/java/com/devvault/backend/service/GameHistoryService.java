package com.devvault.backend.service;

import com.devvault.backend.dto.GameStatsDto;
import com.devvault.backend.entity.GameHistory;
import com.devvault.backend.repository.GameHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GameHistoryService {

    @Autowired
    private GameHistoryRepository gameHistoryRepository;

    public GameHistory saveGameHistory(GameHistory history) {
        if (history.getPlayerOne() == null || history.getPlayerOne().trim().isEmpty()) {
            throw new IllegalArgumentException("Player One email/identifier is required");
        }
        if (history.getPlayerTwo() == null || history.getPlayerTwo().trim().isEmpty()) {
            throw new IllegalArgumentException("Player Two identifier is required");
        }
        if (history.getGameMode() == null || history.getGameMode().trim().isEmpty()) {
            throw new IllegalArgumentException("Game mode is required");
        }
        return gameHistoryRepository.save(history);
    }

    public List<GameHistory> getGameHistoryByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        return gameHistoryRepository.findByPlayerOneOrPlayerTwoOrderByPlayedAtDesc(email, email);
    }

    public void deleteGameHistory(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        if (!gameHistoryRepository.existsById(id)) {
            throw new RuntimeException("Game history record not found");
        }
        gameHistoryRepository.deleteById(id);
    }

    public GameStatsDto getGameStatsByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }

        List<GameHistory> history = gameHistoryRepository.findByPlayerOneOrPlayerTwoOrderByPlayedAtDesc(email, email);
        GameStatsDto stats = new GameStatsDto();

        long gamesPlayed = history.size();
        stats.setGamesPlayed(gamesPlayed);

        if (gamesPlayed == 0) {
            stats.setGamesWon(0);
            stats.setGamesLost(0);
            stats.setGamesDrawn(0);
            stats.setWinRate(0.0);
            stats.setCurrentWinStreak(0);
            stats.setLongestWinStreak(0);
            stats.setFavoriteMode("None");
            stats.setAverageMatchDuration(0.0);
            stats.setTotalMovesPlayed(0);
            return stats;
        }

        long won = 0;
        long lost = 0;
        long drawn = 0;
        long totalMoves = 0;
        long totalDuration = 0;
        Map<String, Integer> modeCounts = new HashMap<>();

        for (GameHistory game : history) {
            // Count outcomes
            if (game.isDraw()) {
                drawn++;
            } else if (email.equalsIgnoreCase(game.getWinner())) {
                won++;
            } else {
                lost++;
            }

            // Stats
            totalMoves += game.getTotalMoves();
            totalDuration += game.getDuration();

            // Modes count
            String modeKey = game.getGameMode();
            modeCounts.put(modeKey, modeCounts.getOrDefault(modeKey, 0) + 1);
        }

        stats.setGamesWon(won);
        stats.setGamesLost(lost);
        stats.setGamesDrawn(drawn);
        stats.setTotalMovesPlayed(totalMoves);
        stats.setAverageMatchDuration((double) totalDuration / gamesPlayed);
        stats.setWinRate(((double) won / gamesPlayed) * 100.0);

        // Compute Streaks
        // History is sorted desc: index 0 is newest, index size-1 is oldest
        int currentStreak = 0;
        for (GameHistory game : history) {
            if (game.isDraw()) {
                break; // draw breaks current win streak
            }
            if (email.equalsIgnoreCase(game.getWinner())) {
                currentStreak++;
            } else {
                break; // loss breaks current win streak
            }
        }
        stats.setCurrentWinStreak(currentStreak);

        // Longest win streak: traverse from oldest (end of list) to newest (start of list)
        int longestStreak = 0;
        int tempStreak = 0;
        for (int i = history.size() - 1; i >= 0; i--) {
            GameHistory game = history.get(i);
            if (!game.isDraw() && email.equalsIgnoreCase(game.getWinner())) {
                tempStreak++;
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
            } else {
                tempStreak = 0; // broken
            }
        }
        stats.setLongestWinStreak(longestStreak);

        // Favorite Mode
        String favoriteMode = "None";
        int maxCount = -1;
        for (Map.Entry<String, Integer> entry : modeCounts.entrySet()) {
            if (entry.getValue() > maxCount) {
                maxCount = entry.getValue();
                favoriteMode = entry.getKey();
            }
        }
        stats.setFavoriteMode(favoriteMode);

        return stats;
    }
}
