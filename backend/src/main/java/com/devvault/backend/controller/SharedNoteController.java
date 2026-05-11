package com.devvault.backend.controller;

import com.devvault.backend.entity.SharedNote;
import com.devvault.backend.repository.SharedNoteRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController

public class SharedNoteController {

    @Autowired
    private SharedNoteRepository sharedNoteRepository;

    @PostMapping("/shareNote")
    public SharedNote shareNote(
            @RequestBody SharedNote sharedNote
    ) {

        return sharedNoteRepository.save(sharedNote);
    }

    @GetMapping("/receivedNotes/{email}")
    public List<SharedNote> getReceivedNotes(
            @PathVariable String email
    ) {

        return sharedNoteRepository.findByReceiverEmail(email);
    }
    @GetMapping("/unreadCount/{email}")
public long getUnreadCount(
        @PathVariable String email
) {

    return sharedNoteRepository
            .countByReceiverEmailAndIsReadFalse(email);
}
    @PutMapping("/markAsRead/{email}")
public String markAsRead(
        @PathVariable String email
) {

    sharedNoteRepository.markNotesAsRead(email);

    return "Notifications Cleared";
}
}