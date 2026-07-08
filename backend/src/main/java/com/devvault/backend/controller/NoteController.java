package com.devvault.backend.controller;

import com.devvault.backend.entity.Note;
import com.devvault.backend.dto.Views;
import com.devvault.backend.repository.NoteRepository;
import com.fasterxml.jackson.annotation.JsonView;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
public class NoteController {

    private static final Logger logger = LoggerFactory.getLogger(NoteController.class);

    @Autowired
    private NoteRepository noteRepository;

    @PostMapping("/addNote")
    @JsonView(Views.Full.class)
    public ResponseEntity<?> addNote(@RequestBody Note note) {
        logger.info("Adding note for email: {}", note.getEmail());
        try {
            Note saved = noteRepository.save(note);
            logger.info("Note saved successfully with id: {}", saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            logger.error("Error saving note: ", e);
            return ResponseEntity.status(500).body("Error saving note: " + e.getMessage());
        }
    }

    // Returns notes sorted: pinned first, then newest first (Summarized payload)
    @GetMapping("/getNotes/{email}")
    @JsonView(Views.Summary.class)
    public ResponseEntity<?> getNotes(@PathVariable String email) {
        logger.info("Fetching notes for email: {}", email);
        try {
            List<Note> notes = noteRepository.findByEmailAndWorkspaceIdIsNullOrderByPinnedDescIdDesc(email);
            logger.info("Found {} notes for email: {}", notes.size(), email);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            logger.error("Error fetching notes for email {}: ", email, e);
            return ResponseEntity.status(500).body("Error fetching notes: " + e.getMessage());
        }
    }

    // Returns full details of a single note
    @GetMapping("/getNote/{id}")
    @JsonView(Views.Full.class)
    public ResponseEntity<?> getNote(@PathVariable Long id) {
        logger.info("Fetching full details for note id: {}", id);
        try {
            Note note = noteRepository.findById(id).orElse(null);
            if (note != null) {
                return ResponseEntity.ok(note);
            }
            return ResponseEntity.status(404).body("Note not found");
        } catch (Exception e) {
            logger.error("Error fetching note: ", e);
            return ResponseEntity.status(500).body("Error fetching note: " + e.getMessage());
        }
    }

    @DeleteMapping("/deleteNote/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable Long id) {
        logger.info("Deleting note with id: {}", id);
        try {
            noteRepository.deleteById(id);
            return ResponseEntity.ok("Note Deleted Successfully");
        } catch (Exception e) {
            logger.error("Error deleting note: ", e);
            return ResponseEntity.status(500).body("Error deleting note: " + e.getMessage());
        }
    }

    @PutMapping("/updateNote/{id}")
    @JsonView(Views.Full.class)
    public ResponseEntity<?> updateNote(@PathVariable Long id, @RequestBody Note updatedNote) {
        logger.info("Updating note with id: {}", id);
        try {
            Note note = noteRepository.findById(id).orElse(null);
            if (note != null) {
                note.setTitle(updatedNote.getTitle());
                note.setContent(updatedNote.getContent());
                note.setTags(updatedNote.getTags());
                return ResponseEntity.ok(noteRepository.save(note));
            }
            return ResponseEntity.status(404).body("Note not found");
        } catch (Exception e) {
            logger.error("Error updating note: ", e);
            return ResponseEntity.status(500).body("Error updating note: " + e.getMessage());
        }
    }

    // Toggle pin state — flips pinned boolean and persists
    @PutMapping("/togglePin/{id}")
    @JsonView(Views.Summary.class)
    public ResponseEntity<?> togglePin(@PathVariable Long id) {
        logger.info("Toggling pin for note with id: {}", id);
        try {
            Note note = noteRepository.findById(id).orElse(null);
            if (note != null) {
                note.setPinned(!note.isPinned());
                return ResponseEntity.ok(noteRepository.save(note));
            }
            return ResponseEntity.status(404).body("Note not found");
        } catch (Exception e) {
            logger.error("Error toggling pin: ", e);
            return ResponseEntity.status(500).body("Error toggling pin: " + e.getMessage());
        }
    }
}