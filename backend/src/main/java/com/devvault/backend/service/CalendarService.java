package com.devvault.backend.service;

import com.devvault.backend.entity.CalendarReminder;
import com.devvault.backend.repository.CalendarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CalendarService {

    @Autowired
    private CalendarRepository calendarRepository;

    public CalendarReminder createReminder(CalendarReminder reminder) {
        return calendarRepository.save(reminder);
    }

    public List<CalendarReminder> getAllRemindersByUser(String userId) {
        return calendarRepository.findByUserId(userId);
    }

    public List<CalendarReminder> getRemindersByUserAndDate(String userId, LocalDate date) {
        return calendarRepository.findByUserIdAndDate(userId, date);
    }

    public List<CalendarReminder> getUpcomingReminders(String userId, LocalDate today) {
        return calendarRepository.findByUserIdAndDateGreaterThanEqual(userId, today);
    }

    public List<CalendarReminder> getOverdueReminders(String userId, LocalDate today) {
        return calendarRepository.findByUserIdAndDateLessThan(userId, today);
    }

    public CalendarReminder updateReminder(Long id, CalendarReminder updatedReminder, String userId) {
        Optional<CalendarReminder> existing = calendarRepository.findById(id);
        if (existing.isPresent() && existing.get().getUserId().equals(userId)) {
            CalendarReminder reminder = existing.get();
            reminder.setTitle(updatedReminder.getTitle());
            reminder.setDescription(updatedReminder.getDescription());
            reminder.setDate(updatedReminder.getDate());
            reminder.setTime(updatedReminder.getTime());
            reminder.setPriority(updatedReminder.getPriority());
            reminder.setCategory(updatedReminder.getCategory());
            reminder.setRepeatType(updatedReminder.getRepeatType());
            reminder.setReminderColor(updatedReminder.getReminderColor());
            reminder.setNotificationEnabled(updatedReminder.isNotificationEnabled());
            reminder.setNotificationTime(updatedReminder.getNotificationTime());
            return calendarRepository.save(reminder);
        }
        throw new RuntimeException("Reminder not found or unauthorized");
    }

    public void deleteReminder(Long id, String userId) {
        Optional<CalendarReminder> existing = calendarRepository.findById(id);
        if (existing.isPresent() && existing.get().getUserId().equals(userId)) {
            calendarRepository.deleteById(id);
        } else {
            throw new RuntimeException("Reminder not found or unauthorized");
        }
    }

    public void deleteReminderById(Long id) {
        calendarRepository.deleteById(id);
    }
}
