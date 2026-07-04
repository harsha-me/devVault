package com.devvault.backend;

import com.devvault.backend.controller.AiController;
import com.devvault.backend.service.AiService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AiControllerTest {

    @InjectMocks
    private AiController aiController;

    @Mock
    private AiService aiService;

    @Test
    void testChatEndpointWithoutApiKey() {
        // Prepare request payload
        Map<String, String> request = new HashMap<>();
        request.put("prompt", "Hello AI");
        request.put("action", "chat");

        // Mock the service to throw IllegalArgumentException when key is missing/invalid
        Mockito.when(aiService.generateContent(Mockito.anyString(), Mockito.any()))
                .thenThrow(new IllegalArgumentException("Gemini API key is not configured."));

        // Call the controller directly
        ResponseEntity<?> response = aiController.chat(null, request);

        // Verify the response is 400 Bad Request with error information
        assertEquals(400, response.getStatusCode().value());
        
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("needsKey"));
        assertEquals("Gemini API key is not configured.", body.get("error"));
    }
}
