package com.devvault.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);

    @Value("${gemini.api.key:}")
    private String systemApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateContent(String prompt, String clientApiKey) {
        String apiKey = (clientApiKey != null && !clientApiKey.trim().isEmpty()) ? clientApiKey : systemApiKey;
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Gemini API key is not configured. Please set it in system environment, application.properties, or in the UI Settings.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build request payload using standard Maps and Lists to avoid POJO overhead
        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentMap = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> partMap = new HashMap<>();
        
        partMap.put("text", prompt);
        parts.add(partMap);
        contentMap.put("parts", parts);
        contents.add(contentMap);
        requestBody.put("contents", contents);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            logger.info("Sending request to Gemini API");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map responseBody = response.getBody();
                List candidates = (List) responseBody.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map content = (Map) candidate.get("content");
                    if (content != null) {
                        List responseParts = (List) content.get("parts");
                        if (responseParts != null && !responseParts.isEmpty()) {
                            Map part = (Map) responseParts.get(0);
                            String text = (String) part.get("text");
                            logger.info("Successfully received generated content from Gemini API");
                            return text;
                        }
                    }
                }
            }
            logger.error("Empty response or unexpected format from Gemini API");
            throw new RuntimeException("Unexpected format in response from Gemini API");
        } catch (Exception e) {
            logger.error("Error communicating with Gemini API: ", e);
            throw new RuntimeException("Error communicating with Gemini API: " + e.getMessage(), e);
        }
    }

    public String generateContentWithImage(String prompt, byte[] imageBytes, String mimeType, String clientApiKey) {
        String apiKey = (clientApiKey != null && !clientApiKey.trim().isEmpty()) ? clientApiKey : systemApiKey;
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Gemini API key is not configured. Please set it in system environment, application.properties, or in the UI Settings.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentMap = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();
        
        // Text prompt part
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        parts.add(textPart);

        // Image inlineData part
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mimeType", mimeType);
        inlineData.put("data", Base64.getEncoder().encodeToString(imageBytes));
        imagePart.put("inlineData", inlineData);
        parts.add(imagePart);

        contentMap.put("parts", parts);
        contents.add(contentMap);
        requestBody.put("contents", contents);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            logger.info("Sending multimodal image request to Gemini API");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map responseBody = response.getBody();
                List candidates = (List) responseBody.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map content = (Map) candidate.get("content");
                    if (content != null) {
                        List responseParts = (List) content.get("parts");
                        if (responseParts != null && !responseParts.isEmpty()) {
                            Map part = (Map) responseParts.get(0);
                            String text = (String) part.get("text");
                            logger.info("Successfully received generated multimodal content from Gemini API");
                            return text;
                        }
                    }
                }
            }
            logger.error("Empty response or unexpected format from Gemini API");
            throw new RuntimeException("Unexpected format in response from Gemini API");
        } catch (Exception e) {
            logger.error("Error communicating with Gemini API: ", e);
            throw new RuntimeException("Error communicating with Gemini API: " + e.getMessage(), e);
        }
    }
}
