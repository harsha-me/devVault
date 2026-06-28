package com.devvault.backend.dto;

import java.time.LocalDate;

public class ProfileDto {
    private Long id;
    private String name;
    private String email;
    private LocalDate memberSince;
    private long totalNotes;
    private long sharedNotes;
    private long totalReminders;

    public ProfileDto() {
    }

    public ProfileDto(Long id, String name, String email, LocalDate memberSince, long totalNotes, long sharedNotes, long totalReminders) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.memberSince = memberSince;
        this.totalNotes = totalNotes;
        this.sharedNotes = sharedNotes;
        this.totalReminders = totalReminders;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getMemberSince() {
        return memberSince;
    }

    public void setMemberSince(LocalDate memberSince) {
        this.memberSince = memberSince;
    }

    public long getTotalNotes() {
        return totalNotes;
    }

    public void setTotalNotes(long totalNotes) {
        this.totalNotes = totalNotes;
    }

    public long getSharedNotes() {
        return sharedNotes;
    }

    public void setSharedNotes(long sharedNotes) {
        this.sharedNotes = sharedNotes;
    }

    public long getTotalReminders() {
        return totalReminders;
    }

    public void setTotalReminders(long totalReminders) {
        this.totalReminders = totalReminders;
    }
}
