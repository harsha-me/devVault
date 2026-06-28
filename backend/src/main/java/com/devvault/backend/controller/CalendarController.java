package com.devvault.backend.controller;

import com.devvault.backend.entity.CalendarReminder;
import com.devvault.backend.service.CalendarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/calendar")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CalendarController {

    @Autowired
    private CalendarService calendarService;

    @PostMapping("/reminders")
    public ResponseEntity<?> createReminder(@RequestBody CalendarReminder reminder, Authentication authentication) {
        String userEmail = authentication.getName();
        reminder.setUserId(userEmail);
        CalendarReminder saved = calendarService.createReminder(reminder);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/reminders")
    public ResponseEntity<?> getAllReminders(Authentication authentication) {
        String userEmail = authentication.getName();
        List<CalendarReminder> reminders = calendarService.getAllRemindersByUser(userEmail);
        return ResponseEntity.ok(reminders);
    }

    @GetMapping("/reminders/dashboard")
    public ResponseEntity<?> getDashboardReminders(Authentication authentication) {
        String userEmail = authentication.getName();
        LocalDate today = LocalDate.now();
        List<CalendarReminder> todayReminders = calendarService.getRemindersByUserAndDate(userEmail, today);
        List<CalendarReminder> upcomingReminders = calendarService.getUpcomingReminders(userEmail, today.plusDays(1));
        List<CalendarReminder> overdueReminders = calendarService.getOverdueReminders(userEmail, today);
        
        Map<String, Object> response = new HashMap<>();
        response.put("today", todayReminders);
        response.put("upcoming", upcomingReminders);
        response.put("overdue", overdueReminders);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/reminders/{id}")
    public ResponseEntity<?> updateReminder(@PathVariable Long id, @RequestBody CalendarReminder reminder, Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            CalendarReminder updated = calendarService.updateReminder(id, reminder, userEmail);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/reminders/{id}")
    public ResponseEntity<?> deleteReminder(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        try {
            calendarService.deleteReminder(id, userEmail);
            return ResponseEntity.ok("Deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
