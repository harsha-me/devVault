package com.devvault.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "workspace_member", indexes = {
    @Index(name = "idx_ws_member_email", columnList = "memberEmail"),
    @Index(name = "idx_ws_member_ws", columnList = "workspaceId")
})
public class WorkspaceMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long workspaceId;

    @Column(nullable = false)
    private String memberEmail;

    @Column(nullable = false)
    private String role; // "OWNER" or "MEMBER"

    public WorkspaceMember() {
    }

    public WorkspaceMember(Long workspaceId, String memberEmail, String role) {
        this.workspaceId = workspaceId;
        this.memberEmail = memberEmail;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getWorkspaceId() {
        return workspaceId;
    }

    public void setWorkspaceId(Long workspaceId) {
        this.workspaceId = workspaceId;
    }

    public String getMemberEmail() {
        return memberEmail;
    }

    public void setMemberEmail(String memberEmail) {
        this.memberEmail = memberEmail;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
