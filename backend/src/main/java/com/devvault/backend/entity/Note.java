package com.devvault.backend.entity;

import com.fasterxml.jackson.annotation.JsonView;
import com.devvault.backend.dto.Views;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import jakarta.persistence.Lob;
import jakarta.persistence.Transient;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "note", indexes = {
    @Index(name = "idx_note_email", columnList = "email"),
    @Index(name = "idx_note_workspace", columnList = "workspaceId")
})
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonView(Views.Summary.class)
    private Long id;

    @Column(nullable = false)
    @JsonView(Views.Summary.class)
    private String email;

    @JsonView(Views.Summary.class)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    @JsonView(Views.Full.class)
    private String content;

    @JsonView(Views.Summary.class)
    private boolean pinned = false;

    @JsonView(Views.Summary.class)
    private Long workspaceId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "note_tags", joinColumns = @JoinColumn(name = "note_id"))
    @Column(name = "tag")
    @JsonView(Views.Summary.class)
    private List<String> tags = new ArrayList<>();

    @Transient
    @JsonView(Views.Summary.class)
    public String getPreview() {
        if (content == null) return "";
        String plain = content.replaceAll("```[\\s\\S]*?```", "[code]")
                              .replaceAll("[#*`>_~\\[\\]]", "")
                              .trim();
        return plain.length() > 150 ? plain.substring(0, 150) + "..." : plain;
    }

    @Transient
    @JsonView(Views.Summary.class)
    public String getReadTime() {
        if (content == null) return "< 1 min read";
        String[] words = content.trim().split("\\s+");
        int count = 0;
        for (String w : words) {
            if (!w.isEmpty()) count++;
        }
        int mins = (int) Math.ceil(count / 200.0);
        return mins < 1 ? "< 1 min read" : mins + " min read";
    }

    @Transient
    @JsonView(Views.Summary.class)
    public String getExtractedCode() {
        if (content == null) return null;
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("```(?:[a-zA-Z0-9+#-]+)?\\n([\\s\\S]*?)\\n?```").matcher(content);
        return matcher.find() ? matcher.group(1) : null;
    }

    public Note() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public Long getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(Long workspaceId) {
        this.workspaceId = workspaceId;
    }
}