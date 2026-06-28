package com.devvault.backend.repository;

import com.devvault.backend.entity.CalendarReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendarRepository extends JpaRepository<CalendarReminder, Long> {
    List<CalendarReminder> findByUserId(String userId);
    long countByUserId(String userId);
    List<CalendarReminder> findByUserIdAndDate(String userId, LocalDate date);
    List<CalendarReminder> findByUserIdAndDateBetween(String userId, LocalDate startDate, LocalDate endDate);
    List<CalendarReminder> findByUserIdAndDateGreaterThanEqual(String userId, LocalDate date);
    List<CalendarReminder> findByUserIdAndDateLessThan(String userId, LocalDate date);
}
