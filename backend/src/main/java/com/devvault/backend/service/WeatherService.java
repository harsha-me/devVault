package com.devvault.backend.service;

import com.devvault.backend.dto.ForecastDayDto;
import com.devvault.backend.dto.WeatherResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeatherService {

    private static final Logger logger = LoggerFactory.getLogger(WeatherService.class);

    @Value("${weather.api.key:}")
    private String apiKey;

    @Value("${weather.api.provider:weatherapi}")
    private String provider;

    @Value("${weather.api.default-city:London}")
    private String defaultCity;

    private final RestTemplate restTemplate = new RestTemplate();

    // In-memory cache
    private static class CachedWeather {
        final WeatherResponseDto data;
        final long timestamp;

        CachedWeather(WeatherResponseDto data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }
    }

    private final Map<String, CachedWeather> cache = new ConcurrentHashMap<>();
    private static final long CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes cache

    /**
     * Get weather by city name.
     */
    public WeatherResponseDto getWeatherByCity(String city) {
        if (city == null || city.trim().isEmpty()) {
            city = defaultCity;
        }
        city = city.trim();

        String cacheKey = "city:" + city.toLowerCase();
        WeatherResponseDto cached = getFromCache(cacheKey);
        if (cached != null) {
            logger.info("Cache hit for city: {}", city);
            return cached;
        }

        WeatherResponseDto data;
        if (isApiKeyMissing()) {
            logger.info("Weather API key missing. Generating mock weather for city: {}", city);
            data = generateMockWeather(city, null, null);
        } else {
            try {
                data = fetchFromWeatherApi(city);
            } catch (Exception e) {
                logger.error("Failed to fetch weather from API for city {}. Falling back to mock.", city, e);
                data = generateMockWeather(city, null, null);
            }
        }

        putInCache(cacheKey, data);
        return data;
    }

    /**
     * Get weather by latitude and longitude.
     */
    public WeatherResponseDto getWeatherByCoordinates(double lat, double lon) {
        // Round to 2 decimal places to optimize caching (~1.1km grid)
        double roundedLat = Math.round(lat * 100.0) / 100.0;
        double roundedLon = Math.round(lon * 100.0) / 100.0;
        String cacheKey = "coords:" + roundedLat + "_" + roundedLon;

        WeatherResponseDto cached = getFromCache(cacheKey);
        if (cached != null) {
            logger.info("Cache hit for coordinates: {}, {}", roundedLat, roundedLon);
            return cached;
        }

        WeatherResponseDto data;
        if (isApiKeyMissing()) {
            logger.info("Weather API key missing. Generating mock weather for coordinates: {}, {}", roundedLat, roundedLon);
            data = generateMockWeather(null, roundedLat, roundedLon);
        } else {
            try {
                String query = roundedLat + "," + roundedLon;
                data = fetchFromWeatherApi(query);
            } catch (Exception e) {
                logger.error("Failed to fetch weather from API for coordinates {}, {}. Falling back to mock.", roundedLat, roundedLon, e);
                data = generateMockWeather(null, roundedLat, roundedLon);
            }
        }

        putInCache(cacheKey, data);
        return data;
    }

    private boolean isApiKeyMissing() {
        return apiKey == null || apiKey.trim().isEmpty() || apiKey.startsWith("${") || apiKey.equalsIgnoreCase("placeholder") || apiKey.equalsIgnoreCase("your_api_key");
    }

    private WeatherResponseDto getFromCache(String key) {
        CachedWeather cached = cache.get(key);
        if (cached != null) {
            if (System.currentTimeMillis() - cached.timestamp < CACHE_DURATION_MS) {
                return cached.data;
            } else {
                cache.remove(key); // Evict expired
            }
        }
        return null;
    }

    private void putInCache(String key, WeatherResponseDto data) {
        cache.put(key, new CachedWeather(data));
    }

    /**
     * Real WeatherAPI fetch implementation.
     */
    private WeatherResponseDto fetchFromWeatherApi(String query) {
        String url = "http://api.weatherapi.com/v1/forecast.json?key=" + apiKey + "&q=" + query + "&days=5&aqi=no&alerts=no";
        logger.info("Fetching real weather data from WeatherAPI: URL simplified for logs");

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null) {
            throw new RuntimeException("Empty response from WeatherAPI");
        }

        WeatherResponseDto dto = new WeatherResponseDto();

        // Location data
        Map<String, Object> location = (Map<String, Object>) response.get("location");
        if (location != null) {
            dto.setCity((String) location.get("name"));
            dto.setCountry((String) location.get("country"));
        } else {
            dto.setCity(query);
            dto.setCountry("Unknown");
        }

        // Current weather data
        Map<String, Object> current = (Map<String, Object>) response.get("current");
        if (current == null) {
            throw new RuntimeException("Current weather object missing in API response");
        }

        dto.setTempC(((Number) current.get("temp_c")).doubleValue());
        dto.setFeelsLikeC(((Number) current.get("feelslike_c")).doubleValue());
        dto.setWindSpeedKph(((Number) current.get("wind_kph")).doubleValue());
        dto.setHumidity(((Number) current.get("humidity")).intValue());
        dto.setPressureMb(((Number) current.get("pressure_mb")).doubleValue());
        dto.setVisibilityKm(((Number) current.get("vis_km")).doubleValue());
        dto.setUvIndex(((Number) current.get("uv")).doubleValue());
        dto.setLastUpdated((String) current.get("last_updated"));

        Map<String, Object> condition = (Map<String, Object>) current.get("condition");
        String originalConditionText = "Clear";
        if (condition != null) {
            originalConditionText = (String) condition.get("text");
        }
        dto.setConditionText(originalConditionText);

        int isDay = 1;
        if (current.containsKey("is_day")) {
            isDay = ((Number) current.get("is_day")).intValue();
        }

        String standardIcon = mapConditionToStandardIcon(originalConditionText, isDay == 1);
        dto.setConditionIcon(standardIcon);

        // Astro and Forecast data
        Map<String, Object> forecastObj = (Map<String, Object>) response.get("forecast");
        List<ForecastDayDto> forecastDaysList = new ArrayList<>();
        if (forecastObj != null) {
            List<Map<String, Object>> forecastday = (List<Map<String, Object>>) forecastObj.get("forecastday");
            if (forecastday != null && !forecastday.isEmpty()) {
                // Get sunrise and sunset from today's astronomical data
                Map<String, Object> todayAstro = (Map<String, Object>) forecastday.get(0).get("astro");
                if (todayAstro != null) {
                    dto.setSunrise((String) todayAstro.get("sunrise"));
                    dto.setSunset((String) todayAstro.get("sunset"));
                } else {
                    dto.setSunrise("06:00 AM");
                    dto.setSunset("08:30 PM");
                }

                // Process 5-day forecast
                for (Map<String, Object> dayContainer : forecastday) {
                    String dateStr = (String) dayContainer.get("date");
                    LocalDate date = LocalDate.parse(dateStr);
                    String dayName = date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

                    Map<String, Object> dayInfo = (Map<String, Object>) dayContainer.get("day");
                    if (dayInfo != null) {
                        double maxTemp = ((Number) dayInfo.get("maxtemp_c")).doubleValue();
                        double minTemp = ((Number) dayInfo.get("mintemp_c")).doubleValue();
                        
                        int rainChance = 0;
                        if (dayInfo.containsKey("daily_chance_of_rain")) {
                            rainChance = ((Number) dayInfo.get("daily_chance_of_rain")).intValue();
                        } else if (dayInfo.containsKey("daily_chance_of_snow")) {
                            rainChance = ((Number) dayInfo.get("daily_chance_of_snow")).intValue();
                        }

                        Map<String, Object> dayCondition = (Map<String, Object>) dayInfo.get("condition");
                        String dayCondText = dayCondition != null ? (String) dayCondition.get("text") : "Sunny";
                        String dayIcon = mapConditionToStandardIcon(dayCondText, true);

                        forecastDaysList.add(new ForecastDayDto(
                                dayName,
                                dateStr,
                                dayCondText,
                                dayIcon,
                                maxTemp,
                                minTemp,
                                rainChance,
                                dayCondText
                        ));
                    }
                }
            }
        }
        dto.setForecast(forecastDaysList);

        // Generate developer insights
        generateInsightsAndQuotes(dto);

        return dto;
    }

    /**
     * Map complex condition strings to standard outlined styles:
     * sunny, cloudy, rainy, stormy, snowy, foggy, night
     */
    private String mapConditionToStandardIcon(String condition, boolean isDay) {
        if (condition == null) return "sunny";
        String cond = condition.toLowerCase();

        if (cond.contains("thunder") || cond.contains("storm") || cond.contains("lightning")) {
            return "stormy";
        } else if (cond.contains("rain") || cond.contains("drizzle") || cond.contains("shower") || cond.contains("precip")) {
            return "rainy";
        } else if (cond.contains("snow") || cond.contains("sleet") || cond.contains("blizzard") || cond.contains("ice") || cond.contains("hail")) {
            return "snowy";
        } else if (cond.contains("fog") || cond.contains("mist") || cond.contains("haze") || cond.contains("smoke")) {
            return "foggy";
        } else if (cond.contains("cloud") || cond.contains("overcast") || cond.contains("dull")) {
            return "cloudy";
        } else {
            return isDay ? "sunny" : "night";
        }
    }

    /**
     * Fill in developer insights, quotes, and best coding times based on weather condition.
     */
    private void generateInsightsAndQuotes(WeatherResponseDto dto) {
        String icon = dto.getConditionIcon();
        String tempStr = String.format("%.0f°C", dto.getTempC());

        String insight;
        String quote;
        String bestTime;

        switch (icon) {
            case "rainy":
                insight = "Rain expected today. Carry an umbrella before heading to work.";
                quote = "A cozy rainy day. Ideal for sipping tea and refactoring code.";
                bestTime = "02:00 PM - 06:00 PM (Cozy indoor afternoon)";
                break;
            case "stormy":
                insight = "Storm expected this evening. Consider finishing your commute early.";
                quote = "A storm brews outside, but our local environment runs in calm streams.";
                bestTime = "03:00 PM - 07:00 PM (Distraction-free storm coding)";
                break;
            case "snowy":
                insight = "Cold weather today. A warm drink and a coding marathon sound perfect.";
                quote = "Cold winds, hot coffee, clean compilation. Happy winter building.";
                bestTime = "01:00 PM - 05:00 PM (Warm coffee shop session)";
                break;
            case "foggy":
                insight = "Low visibility today. Travel carefully.";
                quote = "Foggy weather outside. Keep your focus sharp and code clean.";
                bestTime = "10:00 AM - 02:00 PM (Calm morning focus)";
                break;
            case "cloudy":
                insight = "Cloudy skies today. A great day to clear your backlog.";
                quote = "Muted skies, focused minds. Perfect day to tackle the legacy tasks.";
                bestTime = "09:00 AM - 01:00 PM (Focused midday session)";
                break;
            case "night":
                insight = "Clear night ahead. Perfect for a late-night debugging session.";
                quote = "Under the quiet night sky, code compiles in peace.";
                bestTime = "08:00 PM - 11:30 PM (Late night deep-work)";
                break;
            case "sunny":
            default:
                insight = "Perfect day for a coffee shop coding session.";
                quote = "Sun's out! Perfect weather to build something amazing today.";
                bestTime = "08:00 AM - 11:30 AM (Cool morning breeze)";
                break;
        }

        dto.setDeveloperInsight(insight);
        dto.setCodingQuote(quote);
        dto.setBestCodingTime(bestTime);
    }

    /**
     * Generate high-fidelity simulated weather data if API key is not configured or queries fail.
     */
    private WeatherResponseDto generateMockWeather(String city, Double lat, Double lon) {
        WeatherResponseDto dto = new WeatherResponseDto();

        // Determine city name and country
        if (city != null) {
            dto.setCity(city);
            dto.setCountry("Simulation");
        } else if (lat != null && lon != null) {
            dto.setCity("Local Area (" + String.format("%.2f", lat) + ", " + String.format("%.2f", lon) + ")");
            dto.setCountry("Detected Geolocation");
        } else {
            dto.setCity(defaultCity);
            dto.setCountry("Simulation");
        }

        // Determine weather type based on city name hash or coordinates to make it consistent
        String nameForHash = dto.getCity().toLowerCase();
        int hash = nameForHash.hashCode();
        
        String standardIcon = "sunny";
        String conditionText = "Sunny";
        double temp = 22.5;
        double feelsLike = 23.5;
        double wind = 12.0;
        int humidity = 55;
        double visibility = 10.0;
        double pressure = 1013.2;
        double uv = 5.0;

        if (nameForHash.contains("seattle") || nameForHash.contains("london") || nameForHash.contains("vancouver") || nameForHash.contains("rain")) {
            standardIcon = "rainy";
            conditionText = "Light Drizzle";
            temp = 14.5;
            feelsLike = 13.5;
            wind = 18.5;
            humidity = 88;
            visibility = 7.5;
            pressure = 1008.1;
            uv = 2.0;
        } else if (nameForHash.contains("storm") || nameForHash.contains("florida") || Math.abs(hash) % 7 == 0) {
            standardIcon = "stormy";
            conditionText = "Thundery Outbreaks Nearby";
            temp = 26.0;
            feelsLike = 29.5;
            wind = 28.0;
            humidity = 90;
            visibility = 6.0;
            pressure = 1002.5;
            uv = 3.0;
        } else if (nameForHash.contains("snow") || nameForHash.contains("toronto") || nameForHash.contains("oslo") || nameForHash.contains("moscow")) {
            standardIcon = "snowy";
            conditionText = "Light Snow Shower";
            temp = -1.5;
            feelsLike = -5.0;
            wind = 15.0;
            humidity = 78;
            visibility = 8.0;
            pressure = 1018.4;
            uv = 1.0;
        } else if (nameForHash.contains("fog") || nameForHash.contains("san francisco") || Math.abs(hash) % 7 == 1) {
            standardIcon = "foggy";
            conditionText = "Mist and Fog";
            temp = 12.0;
            feelsLike = 11.5;
            wind = 6.0;
            humidity = 95;
            visibility = 1.5;
            pressure = 1015.0;
            uv = 1.5;
        } else if (nameForHash.contains("cloud") || nameForHash.contains("paris") || Math.abs(hash) % 7 == 2 || Math.abs(hash) % 7 == 3) {
            standardIcon = "cloudy";
            conditionText = "Partly Cloudy";
            temp = 18.0;
            feelsLike = 18.0;
            wind = 10.0;
            humidity = 65;
            visibility = 10.0;
            pressure = 1012.8;
            uv = 4.0;
        }

        // Adjust for coordinates if coordinates are used directly
        if (lat != null) {
            if (lat > 55.0 || lat < -55.0) { // Polar regions, colder
                standardIcon = "snowy";
                conditionText = "Cold Snow flurries";
                temp = -3.0;
                feelsLike = -8.0;
                humidity = 82;
            } else if (lat > -15.0 && lat < 15.0) { // Tropical, warmer
                standardIcon = "sunny";
                conditionText = "Hot and Sunny";
                temp = 31.0;
                feelsLike = 35.0;
                humidity = 70;
            }
        }

        dto.setTempC(temp);
        dto.setFeelsLikeC(feelsLike);
        dto.setConditionText(conditionText);
        dto.setConditionIcon(standardIcon);
        dto.setWindSpeedKph(wind);
        dto.setHumidity(humidity);
        dto.setSunrise("05:42 AM");
        dto.setSunset("08:48 PM");
        dto.setPressureMb(pressure);
        dto.setVisibilityKm(visibility);
        dto.setUvIndex(uv);
        dto.setLastUpdated(LocalDate.now().toString() + " 12:00 (Simulation)");

        // 5-Day Forecast
        List<ForecastDayDto> forecastDaysList = new ArrayList<>();
        LocalDate startDay = LocalDate.now();

        // Create standard patterns of weather for forecast days
        String[] mockIcons = {"sunny", "cloudy", "rainy", "cloudy", "sunny"};
        String[] mockConds = {"Clear and Sunny", "Mostly Cloudy", "Passing Showers", "Overcast", "Sunny"};
        if ("rainy".equals(standardIcon)) {
            mockIcons = new String[]{"rainy", "rainy", "cloudy", "sunny", "sunny"};
            mockConds = new String[]{"Heavy Rain", "Light Showers", "Partly Cloudy", "Sunny", "Sunny"};
        } else if ("snowy".equals(standardIcon)) {
            mockIcons = new String[]{"snowy", "snowy", "cloudy", "cloudy", "sunny"};
            mockConds = new String[]{"Snow Showers", "Overcast Skies", "Freezing Fog", "Mostly Cloudy", "Clear and Cold"};
        }

        for (int i = 0; i < 5; i++) {
            LocalDate currentDay = startDay.plusDays(i);
            String dayName = currentDay.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            String forecastIcon = mockIcons[i % mockIcons.length];
            String forecastCond = mockConds[i % mockConds.length];

            double high = temp + (i == 0 ? 2 : (i % 2 == 0 ? 3 : -1));
            double low = temp - (i == 0 ? 4 : (i % 2 == 0 ? 2 : 5));
            int rainChance = forecastIcon.equals("rainy") ? 80 : forecastIcon.equals("stormy") ? 90 : forecastIcon.equals("cloudy") ? 25 : 5;

            forecastDaysList.add(new ForecastDayDto(
                    dayName,
                    currentDay.toString(),
                    forecastCond,
                    forecastIcon,
                    high,
                    low,
                    rainChance,
                    forecastCond
            ));
        }

        dto.setForecast(forecastDaysList);

        // Generate insights and quotes
        generateInsightsAndQuotes(dto);

        return dto;
    }
}
