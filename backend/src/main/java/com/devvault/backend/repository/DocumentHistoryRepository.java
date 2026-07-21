package com.devvault.backend.repository;

import com.devvault.backend.entity.DocumentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface DocumentHistoryRepository extends JpaRepository<DocumentHistory, Long> {
    
    List<DocumentHistory> findByEmailOrderByIdDesc(String email);

    long countByEmail(String email);

    long countByEmailAndDate(String email, LocalDate date);
}
