package com.devvault.backend.dto;

public class ForecastDayDto {
    private String dayOfWeek;
    private String date;
    private String conditionText;
    private String conditionIcon;
    private double maxTempC;
    private double minTempC;
    private int chanceOfRain;
    private String description;

    public ForecastDayDto() {}

    public ForecastDayDto(String dayOfWeek, String date, String conditionText, String conditionIcon, 
                          double maxTempC, double minTempC, int chanceOfRain, String description) {
        this.dayOfWeek = dayOfWeek;
        this.date = date;
        this.conditionText = conditionText;
        this.conditionIcon = conditionIcon;
        this.maxTempC = maxTempC;
        this.minTempC = minTempC;
        this.chanceOfRain = chanceOfRain;
        this.description = description;
    }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getConditionText() { return conditionText; }
    public void setConditionText(String conditionText) { this.conditionText = conditionText; }

    public String getConditionIcon() { return conditionIcon; }
    public void setConditionIcon(String conditionIcon) { this.conditionIcon = conditionIcon; }

    public double getMaxTempC() { return maxTempC; }
    public void setMaxTempC(double maxTempC) { this.maxTempC = maxTempC; }

    public double getMinTempC() { return minTempC; }
    public void setMinTempC(double minTempC) { this.minTempC = minTempC; }

    public int getChanceOfRain() { return chanceOfRain; }
    public void setChanceOfRain(int chanceOfRain) { this.chanceOfRain = chanceOfRain; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
