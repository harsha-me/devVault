package com.devvault.backend.service;

import com.devvault.backend.dto.ProfileDto;
import com.devvault.backend.entity.User;
import com.devvault.backend.repository.UserRepository;
import com.devvault.backend.repository.NoteRepository;
import com.devvault.backend.repository.SharedNoteRepository;
import com.devvault.backend.repository.CalendarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private SharedNoteRepository sharedNoteRepository;

    @Autowired
    private CalendarRepository calendarRepository;

    public ProfileDto getProfile(String email) {
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Invalid email format");
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        long totalNotes = noteRepository.countByEmail(email);
        long sharedNotes = sharedNoteRepository.countBySenderEmail(email);
        long totalReminders = calendarRepository.countByUserId(email);

        return new ProfileDto(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getMemberSince(),
            totalNotes,
            sharedNotes,
            totalReminders
        );
    }
}
