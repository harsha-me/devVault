package com.devvault.backend.dto;

public class CompileRequest {
    private String code;
    private String language; // Keep it extensible for future languages

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
