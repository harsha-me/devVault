package com.devvault.backend.controller;

import com.devvault.backend.dto.WeatherResponseDto;
import com.devvault.backend.service.WeatherService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
public class WeatherController {

    private static final Logger logger = LoggerFactory.getLogger(WeatherController.class);

    @Autowired
    private WeatherService weatherService;

    /**
     * GET /weather?city={city}
     * Queries weather by city name.
     */
    @GetMapping("/weather")
    public ResponseEntity<?> getWeather(@RequestParam(value = "city", required = false) String city) {
        logger.info("Received request for weather. City parameter: {}", city);
        try {
            WeatherResponseDto weather = weatherService.getWeatherByCity(city);
            return ResponseEntity.ok(weather);
        } catch (Exception e) {
            logger.error("Error retrieving weather for city: {}", city, e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Weather service is currently unavailable. Please try again later.");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * GET /weather/current?lat={lat}&lon={lon}
     * Queries weather by latitude and longitude. Fallback to default city if coordinates are not provided.
     */
    @GetMapping("/weather/current")
    public ResponseEntity<?> getCurrentLocationWeather(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lon", required = false) Double lon) {
        
        logger.info("Received request for current location weather. Coordinates: lat={}, lon={}", lat, lon);
        try {
            WeatherResponseDto weather;
            if (lat != null && lon != null) {
                weather = weatherService.getWeatherByCoordinates(lat, lon);
            } else {
                logger.info("Coordinates missing. Falling back to default city query.");
                weather = weatherService.getWeatherByCity(null);
            }
            return ResponseEntity.ok(weather);
        } catch (Exception e) {
            logger.error("Error retrieving current weather", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Weather service is currently unavailable. Please try again later.");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
