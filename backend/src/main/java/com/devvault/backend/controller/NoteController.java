package com.devvault.backend.controller;

import com.devvault.backend.entity.Note;
import com.devvault.backend.repository.NoteRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin("*")
public class NoteController {

    @Autowired
    private NoteRepository noteRepository;

    @PostMapping("/addNote")
    public Note addNote(@RequestBody Note note) {

        return noteRepository.save(note);
    }

    @GetMapping("/getNotes/{email}")
    public List<Note> getNotes(@PathVariable String email) {

        return noteRepository.findByEmail(email);
    }
    @DeleteMapping("/deleteNote/{id}")
public String deleteNote(@PathVariable Long id) {

    noteRepository.deleteById(id);

    return "Note Deleted Successfully";
}
@PutMapping("/updateNote/{id}")
public Note updateNote(
        @PathVariable Long id,
        @RequestBody Note updatedNote
) {

    Note note = noteRepository.findById(id).orElse(null);

    if (note != null) {

        note.setTitle(updatedNote.getTitle());

        note.setContent(updatedNote.getContent());

        return noteRepository.save(note);
    }

    return null;
}
}