package com.devvault.backend;

import com.devvault.backend.entity.Note;
import com.devvault.backend.repository.NoteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private NoteRepository noteRepository;

    @Test
    void contextLoads() {
    }

    @Test
    void testSaveAndRetrieveLongNoteAndCode() {
        // 1. Create a regular note
        Note normalNote = new Note();
        normalNote.setEmail("test@devvault.com");
        normalNote.setTitle("Regular Note");
        normalNote.setContent("This is a normal note with some simple text.");
        noteRepository.save(normalNote);

        // 2. Create a very long note with a code snippet (exceeding 255 character limit)
        Note codeNote = new Note();
        codeNote.setEmail("test@devvault.com");
        codeNote.setTitle("Code Snippet Note");

        // Build a long content (> 1000 characters) containing java code
        StringBuilder longContent = new StringBuilder();
        longContent.append("```java\n");
        longContent.append("public class HelloWorld {\n");
        longContent.append("    public static void main(String[] args) {\n");
        for (int i = 0; i < 50; i++) {
            longContent.append("        // Line ").append(i).append(": Printing some test messages to fill up space and make this note extremely long to verify LONGTEXT behaves correctly and avoids column constraints...\n");
        }
        longContent.append("        System.out.println(\"Hello, World!\");\n");
        longContent.append("    }\n");
        longContent.append("}\n");
        longContent.append("```");

        String longCodeString = longContent.toString();
        assertTrue(longCodeString.length() > 1000, "Content must be longer than 1000 characters to verify fix");
        codeNote.setContent(longCodeString);
        noteRepository.save(codeNote);

        // 3. Fetch from repository and assert
        List<Note> notes = noteRepository.findByEmailOrderByPinnedDescIdDesc("test@devvault.com");
        assertNotNull(notes);
        assertEquals(2, notes.size());

        // Assert content is stored and retrieved perfectly
        Note retrievedCodeNote = notes.stream()
                .filter(n -> n.getTitle().equals("Code Snippet Note"))
                .findFirst()
                .orElse(null);

        assertNotNull(retrievedCodeNote);
        assertEquals(longCodeString, retrievedCodeNote.getContent());
        System.out.println("TEST SUCCESS: Note with long code snippet (" + retrievedCodeNote.getContent().length() + " characters) successfully saved and retrieved!");
    }
}
