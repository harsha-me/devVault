package com.devvault.backend.dto;

public class GameStatsDto {
    private long gamesPlayed;
    private long gamesWon;
    private long gamesLost;
    private long gamesDrawn;
    private double winRate;
    private int currentWinStreak;
    private int longestWinStreak;
    private String favoriteMode;
    private double averageMatchDuration; // in seconds
    private long totalMovesPlayed;

    public GameStatsDto() {
    }

    public long getGamesPlayed() {
        return gamesPlayed;
    }

    public void setGamesPlayed(long gamesPlayed) {
        this.gamesPlayed = gamesPlayed;
    }

    public long getGamesWon() {
        return gamesWon;
    }

    public void setGamesWon(long gamesWon) {
        this.gamesWon = gamesWon;
    }

    public long getGamesLost() {
        return gamesLost;
    }

    public void setGamesLost(long gamesLost) {
        this.gamesLost = gamesLost;
    }

    public long getGamesDrawn() {
        return gamesDrawn;
    }

    public void setGamesDrawn(long gamesDrawn) {
        this.gamesDrawn = gamesDrawn;
    }

    public double getWinRate() {
        return winRate;
    }

    public void setWinRate(double winRate) {
        this.winRate = winRate;
    }

    public int getCurrentWinStreak() {
        return currentWinStreak;
    }

    public void setCurrentWinStreak(int currentWinStreak) {
        this.currentWinStreak = currentWinStreak;
    }

    public int getLongestWinStreak() {
        return longestWinStreak;
    }

    public void setLongestWinStreak(int longestWinStreak) {
        this.longestWinStreak = longestWinStreak;
    }

    public String getFavoriteMode() {
        return favoriteMode;
    }

    public void setFavoriteMode(String favoriteMode) {
        this.favoriteMode = favoriteMode;
    }

    public double getAverageMatchDuration() {
        return averageMatchDuration;
    }

    public void setAverageMatchDuration(double averageMatchDuration) {
        this.averageMatchDuration = averageMatchDuration;
    }

    public long getTotalMovesPlayed() {
        return totalMovesPlayed;
    }

    public void setTotalMovesPlayed(long totalMovesPlayed) {
        this.totalMovesPlayed = totalMovesPlayed;
    }
}
