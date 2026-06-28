package com.devvault.backend.controller;

import com.devvault.backend.entity.CalendarReminder;
import com.devvault.backend.service.CalendarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
public class CalendarController {

    @Autowired
    private CalendarService calendarService;

    @PostMapping("/calendar/reminders/{email}")
    public ResponseEntity<?> createReminder(@PathVariable String email, @RequestBody CalendarReminder reminder) {
        reminder.setUserId(email);
        CalendarReminder saved = calendarService.createReminder(reminder);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/calendar/reminders/{email}")
    public ResponseEntity<?> getAllReminders(@PathVariable String email) {
        List<CalendarReminder> reminders = calendarService.getAllRemindersByUser(email);
        return ResponseEntity.ok(reminders);
    }

    @GetMapping("/calendar/reminders/dashboard/{email}")
    public ResponseEntity<?> getDashboardReminders(@PathVariable String email) {
        LocalDate today = LocalDate.now();
        List<CalendarReminder> todayReminders = calendarService.getRemindersByUserAndDate(email, today);
        List<CalendarReminder> upcomingReminders = calendarService.getUpcomingReminders(email, today.plusDays(1));
        List<CalendarReminder> overdueReminders = calendarService.getOverdueReminders(email, today);

        Map<String, Object> response = new HashMap<>();
        response.put("today", todayReminders);
        response.put("upcoming", upcomingReminders);
        response.put("overdue", overdueReminders);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/calendar/reminders/update/{id}")
    public ResponseEntity<?> updateReminder(@PathVariable Long id, @RequestBody CalendarReminder reminder) {
        try {
            CalendarReminder updated = calendarService.updateReminder(id, reminder, reminder.getUserId());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/calendar/reminders/delete/{id}")
    public ResponseEntity<?> deleteReminder(@PathVariable Long id) {
        try {
            calendarService.deleteReminderById(id);
            return ResponseEntity.ok("Deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
