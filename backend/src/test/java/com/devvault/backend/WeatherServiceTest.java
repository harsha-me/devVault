package com.devvault.backend;

import com.devvault.backend.dto.WeatherResponseDto;
import com.devvault.backend.service.WeatherService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class WeatherServiceTest {

    @Autowired
    private WeatherService weatherService;

    @Test
    void testGetWeatherByCityMockMode() {
        // Query a mock city
        WeatherResponseDto response = weatherService.getWeatherByCity("Seattle");
        
        assertNotNull(response);
        assertEquals("Seattle", response.getCity());
        assertEquals("Simulation", response.getCountry());
        assertEquals("rainy", response.getConditionIcon());
        assertNotNull(response.getDeveloperInsight());
        assertNotNull(response.getCodingQuote());
        assertNotNull(response.getBestCodingTime());
        
        // Check forecast
        assertNotNull(response.getForecast());
        assertEquals(5, response.getForecast().size());
        String expectedDay = java.time.LocalDate.now().getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH);
        assertEquals(expectedDay, response.getForecast().get(0).getDayOfWeek());
    }

    @Test
    void testGetWeatherByCoordinatesMockMode() {
        // Test high latitude (polar, colder/snowy)
        WeatherResponseDto responsePolar = weatherService.getWeatherByCoordinates(70.0, -10.0);
        assertNotNull(responsePolar);
        assertEquals("snowy", responsePolar.getConditionIcon());
        assertTrue(responsePolar.getTempC() < 0, "Polar temperature should be below freezing");

        // Test equator latitude (tropical, warmer/sunny)
        WeatherResponseDto responseEquator = weatherService.getWeatherByCoordinates(5.0, 10.0);
        assertNotNull(responseEquator);
        assertEquals("sunny", responseEquator.getConditionIcon());
        assertTrue(responseEquator.getTempC() > 25, "Equator temperature should be warm");
    }
}
