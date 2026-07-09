package com.devvault.backend.dto;

import java.util.List;

public class WeatherResponseDto {
    private String city;
    private String country;
    private double tempC;
    private double feelsLikeC;
    private String conditionText;
    private String conditionIcon;
    private double windSpeedKph;
    private int humidity;
    private String sunrise;
    private String sunset;
    private double pressureMb;
    private double visibilityKm;
    private double uvIndex;
    private String lastUpdated;
    private String developerInsight;
    private String bestCodingTime;
    private String codingQuote;
    private List<ForecastDayDto> forecast;

    public WeatherResponseDto() {}

    // Getters and Setters
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public double getTempC() { return tempC; }
    public void setTempC(double tempC) { this.tempC = tempC; }

    public double getFeelsLikeC() { return feelsLikeC; }
    public void setFeelsLikeC(double feelsLikeC) { this.feelsLikeC = feelsLikeC; }

    public String getConditionText() { return conditionText; }
    public void setConditionText(String conditionText) { this.conditionText = conditionText; }

    public String getConditionIcon() { return conditionIcon; }
    public void setConditionIcon(String conditionIcon) { this.conditionIcon = conditionIcon; }

    public double getWindSpeedKph() { return windSpeedKph; }
    public void setWindSpeedKph(double windSpeedKph) { this.windSpeedKph = windSpeedKph; }

    public int getHumidity() { return humidity; }
    public void setHumidity(int humidity) { this.humidity = humidity; }

    public String getSunrise() { return sunrise; }
    public void setSunrise(String sunrise) { this.sunrise = sunrise; }

    public String getSunset() { return sunset; }
    public void setSunset(String sunset) { this.sunset = sunset; }

    public double getPressureMb() { return pressureMb; }
    public void setPressureMb(double pressureMb) { this.pressureMb = pressureMb; }

    public double getVisibilityKm() { return visibilityKm; }
    public void setVisibilityKm(double visibilityKm) { this.visibilityKm = visibilityKm; }

    public double getUvIndex() { return uvIndex; }
    public void setUvIndex(double uvIndex) { this.uvIndex = uvIndex; }

    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    public String getDeveloperInsight() { return developerInsight; }
    public void setDeveloperInsight(String developerInsight) { this.developerInsight = developerInsight; }

    public String getBestCodingTime() { return bestCodingTime; }
    public void setBestCodingTime(String bestCodingTime) { this.bestCodingTime = bestCodingTime; }

    public String getCodingQuote() { return codingQuote; }
    public void setCodingQuote(String codingQuote) { this.codingQuote = codingQuote; }

    public List<ForecastDayDto> getForecast() { return forecast; }
    public void setForecast(List<ForecastDayDto> forecast) { this.forecast = forecast; }
}
