package com.devvault.backend;

import com.devvault.backend.controller.GameController;
import com.devvault.backend.dto.GameStatsDto;
import com.devvault.backend.entity.GameHistory;
import com.devvault.backend.repository.GameHistoryRepository;
import com.devvault.backend.service.GameHistoryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class GameHistoryTest {

    @InjectMocks
    private GameHistoryService gameHistoryService;

    @Mock
    private GameHistoryRepository gameHistoryRepository;

    @Test
    void testStatsCalculationWithNoGames() {
        String email = "test@example.com";
        Mockito.when(gameHistoryRepository.findByPlayerOneOrPlayerTwoOrderByPlayedAtDesc(email, email))
                .thenReturn(new ArrayList<>());

        GameStatsDto stats = gameHistoryService.getGameStatsByEmail(email);

        assertEquals(0, stats.getGamesPlayed());
        assertEquals(0, stats.getGamesWon());
        assertEquals(0, stats.getGamesLost());
        assertEquals(0, stats.getGamesDrawn());
        assertEquals(0.0, stats.getWinRate());
        assertEquals(0, stats.getCurrentWinStreak());
        assertEquals(0, stats.getLongestWinStreak());
        assertEquals("None", stats.getFavoriteMode());
        assertEquals(0.0, stats.getAverageMatchDuration());
        assertEquals(0, stats.getTotalMovesPlayed());
    }

    @Test
    void testStatsCalculationWithMultipleGames() {
        String email = "test@example.com";
        List<GameHistory> mockHistory = new ArrayList<>();

        // Match 1 (most recent): Win, duration 100, moves 9
        GameHistory match1 = new GameHistory();
        match1.setPlayerOne(email);
        match1.setPlayerTwo("AI Bot");
        match1.setGameMode("AI (HARD)");
        match1.setWinner(email);
        match1.setLoser("AI Bot");
        match1.setDraw(false);
        match1.setTotalMoves(9);
        match1.setDuration(100);
        mockHistory.add(match1);

        // Match 2: Win, duration 120, moves 7
        GameHistory match2 = new GameHistory();
        match2.setPlayerOne(email);
        match2.setPlayerTwo("AI Bot");
        match2.setGameMode("AI (HARD)");
        match2.setWinner(email);
        match2.setLoser("AI Bot");
        match2.setDraw(false);
        match2.setTotalMoves(7);
        match2.setDuration(120);
        mockHistory.add(match2);

        // Match 3: Draw, duration 80, moves 9
        GameHistory match3 = new GameHistory();
        match3.setPlayerOne(email);
        match3.setPlayerTwo("Local Friend");
        match3.setGameMode("Local Friend");
        match3.setWinner(null);
        match3.setLoser(null);
        match3.setDraw(true);
        match3.setTotalMoves(9);
        match3.setDuration(80);
        mockHistory.add(match3);

        // Match 4: Win, duration 60, moves 5
        GameHistory match4 = new GameHistory();
        match4.setPlayerOne(email);
        match4.setPlayerTwo("AI Bot");
        match4.setGameMode("AI (EASY)");
        match4.setWinner(email);
        match4.setLoser("AI Bot");
        match4.setDraw(false);
        match4.setTotalMoves(5);
        match4.setDuration(60);
        mockHistory.add(match4);

        // Match 5 (oldest): Loss, duration 90, moves 6
        GameHistory match5 = new GameHistory();
        match5.setPlayerOne(email);
        match5.setPlayerTwo("AI Bot");
        match5.setGameMode("AI (HARD)");
        match5.setWinner("AI Bot");
        match5.setLoser(email);
        match5.setDraw(false);
        match5.setTotalMoves(6);
        match5.setDuration(90);
        mockHistory.add(match5);

        Mockito.when(gameHistoryRepository.findByPlayerOneOrPlayerTwoOrderByPlayedAtDesc(email, email))
                .thenReturn(mockHistory);

        GameStatsDto stats = gameHistoryService.getGameStatsByEmail(email);

        assertEquals(5, stats.getGamesPlayed());
        assertEquals(3, stats.getGamesWon());
        assertEquals(1, stats.getGamesLost());
        assertEquals(1, stats.getGamesDrawn());
        assertEquals(60.0, stats.getWinRate(), 0.01);
        assertEquals(2, stats.getCurrentWinStreak()); // match1 (win) & match2 (win) then match3 (draw) breaks it
        assertEquals(2, stats.getLongestWinStreak()); // longest consecutive wins is 2 (match1, match2)
        assertEquals("AI (HARD)", stats.getFavoriteMode());
        assertEquals(90.0, stats.getAverageMatchDuration());
        assertEquals(36, stats.getTotalMovesPlayed());
    }
}
