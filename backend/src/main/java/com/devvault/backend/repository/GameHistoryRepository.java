package com.devvault.backend.repository;

import com.devvault.backend.entity.GameHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GameHistoryRepository extends JpaRepository<GameHistory, Long> {
    List<GameHistory> findByPlayerOneOrPlayerTwoOrderByPlayedAtDesc(String playerOne, String playerTwo);
}
