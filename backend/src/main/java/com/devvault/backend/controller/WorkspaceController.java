package com.devvault.backend.controller;

import com.devvault.backend.dto.Views;
import com.devvault.backend.entity.Workspace;
import com.devvault.backend.entity.WorkspaceMember;
import com.devvault.backend.entity.Note;
import com.devvault.backend.repository.WorkspaceRepository;
import com.devvault.backend.repository.WorkspaceMemberRepository;
import com.devvault.backend.repository.NoteRepository;
import com.fasterxml.jackson.annotation.JsonView;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WorkspaceController {

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private NoteRepository noteRepository;

    // Create a workspace and automatically add the creator as OWNER
    @PostMapping
    public ResponseEntity<?> createWorkspace(@RequestBody Workspace workspace) {
        if (workspace.getName() == null || workspace.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Workspace name cannot be empty");
        }
        if (workspace.getOwnerEmail() == null || workspace.getOwnerEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Owner email cannot be empty");
        }
        try {
            Workspace savedWorkspace = workspaceRepository.save(workspace);
            
            // Add creator as OWNER member
            WorkspaceMember ownerMember = new WorkspaceMember(savedWorkspace.getId(), savedWorkspace.getOwnerEmail(), "OWNER");
            workspaceMemberRepository.save(ownerMember);

            return ResponseEntity.ok(savedWorkspace);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating workspace: " + e.getMessage());
        }
    }

    // Get all workspaces a user is part of
    @GetMapping("/user/{email}")
    public ResponseEntity<?> getUserWorkspaces(@PathVariable String email) {
        try {
            List<WorkspaceMember> memberships = workspaceMemberRepository.findByMemberEmail(email);
            List<Workspace> workspaces = new ArrayList<>();
            for (WorkspaceMember member : memberships) {
                workspaceRepository.findById(member.getWorkspaceId()).ifPresent(workspaces::add);
            }
            return ResponseEntity.ok(workspaces);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching workspaces: " + e.getMessage());
        }
    }

    // Invite teammate to workspace
    @PostMapping("/{id}/invite")
    public ResponseEntity<?> inviteTeammate(@PathVariable Long id, @RequestBody Map<String, String> requestBody) {
        String email = requestBody.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email cannot be empty");
        }
        try {
            if (!workspaceRepository.existsById(id)) {
                return ResponseEntity.status(404).body("Workspace not found");
            }
            
            if (workspaceMemberRepository.existsByWorkspaceIdAndMemberEmail(id, email)) {
                return ResponseEntity.badRequest().body("User is already a member of this workspace");
            }

            WorkspaceMember newMember = new WorkspaceMember(id, email, "MEMBER");
            workspaceMemberRepository.save(newMember);
            return ResponseEntity.ok("Successfully invited teammate!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error inviting teammate: " + e.getMessage());
        }
    }

    // Get all members of a workspace
    @GetMapping("/{id}/members")
    public ResponseEntity<?> getWorkspaceMembers(@PathVariable Long id) {
        try {
            List<WorkspaceMember> members = workspaceMemberRepository.findByWorkspaceId(id);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching members: " + e.getMessage());
        }
    }

    // Get all notes belonging to a specific workspace (Summarized payload)
    @GetMapping("/{id}/notes")
    @JsonView(Views.Summary.class)
    public ResponseEntity<?> getWorkspaceNotes(@PathVariable Long id) {
        try {
            List<Note> notes = noteRepository.findByWorkspaceIdOrderByPinnedDescIdDesc(id);
            return ResponseEntity.ok(notes);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching workspace notes: " + e.getMessage());
        }
    }
}
