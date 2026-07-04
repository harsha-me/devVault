package com.devvault.backend.controller;

import com.devvault.backend.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final Logger logger = LoggerFactory.getLogger(AiController.class);

    @Autowired
    private AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<?> chat(
            @RequestHeader(value = "X-Gemini-Key", required = false) String customApiKey,
            @RequestBody Map<String, String> request) {
        
        String prompt = request.get("prompt");
        String noteTitle = request.get("noteTitle");
        String noteContent = request.get("noteContent");
        String selectedText = request.get("selectedText");
        String action = request.get("action"); // explain, optimize, bugs, chat, generate

        logger.info("Received AI request. Action: {}, Note Title: {}", action, noteTitle);

        if (prompt == null) {
            prompt = "";
        }

        // Build a prompt customized for the developer assistant context
        StringBuilder fullPrompt = new StringBuilder();
        fullPrompt.append("You are an expert AI programming companion integrated within DevVault (a modern notes, compilation, and collaborative space for developers).\n");
        fullPrompt.append("Format your responses using clean, readable Markdown. When displaying code blocks, always specify the programming language (e.g. ```javascript, ```java, ```python) so that the syntax highlighter functions correctly.\n\n");

        if (noteTitle != null && !noteTitle.trim().isEmpty()) {
            fullPrompt.append("The current note is titled: \"").append(noteTitle.trim()).append("\"\n");
        }
        
        if (noteContent != null && !noteContent.trim().isEmpty()) {
            fullPrompt.append("The current note content is:\n```\n").append(noteContent.trim()).append("\n```\n\n");
        }

        if (selectedText != null && !selectedText.trim().isEmpty()) {
            fullPrompt.append("The developer has specifically highlighted/selected the following text:\n```\n").append(selectedText.trim()).append("\n```\n\n");
        }

        if ("explain".equalsIgnoreCase(action)) {
            fullPrompt.append("TASK: Analyze and explain the selected code block or note content above. Explain the core logic, how it works, and provide clear operational instructions or explanations.");
        } else if ("optimize".equalsIgnoreCase(action)) {
            fullPrompt.append("TASK: Analyze the selected code block or note content above. Suggest performance, memory usage, and readability optimizations. Provide actionable improvements and refactored code blocks with comments.");
        } else if ("bugs".equalsIgnoreCase(action)) {
            fullPrompt.append("TASK: Audit the selected code block or note content above for potential bugs, logic flaws, memory leaks, runtime issues, or security vulnerabilities. Explain each issue clearly and show how to fix it with corrected code.");
        } else if ("generate".equalsIgnoreCase(action)) {
            fullPrompt.append("TASK: Generate code or markdown content based on the following instruction: \"").append(prompt.trim()).append("\". Take into account the surrounding note context above if relevant. Ensure the output is clean and ready to write.");
        } else {
            // General Chat
            fullPrompt.append("TASK: Answer the following user question or request within the context of their note:\n\"").append(prompt.trim()).append("\"");
        }

        try {
            String aiResponse = aiService.generateContent(fullPrompt.toString(), customApiKey);
            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("response", aiResponse);
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid key or configuration: {}", e.getMessage());
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("error", e.getMessage());
            errorBody.put("needsKey", true);
            return ResponseEntity.badRequest().body(errorBody);
        } catch (Exception e) {
            logger.error("Error processing AI request: ", e);
            Map<String, String> errorBody = new HashMap<>();
            errorBody.put("error", e.getMessage());
            return ResponseEntity.status(500).body(errorBody);
        }
    }
}
