package com.devvault.backend.repository;

import com.devvault.backend.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByEmail(String email);

    List<Note> findByEmailOrderByPinnedDescIdDesc(String email);

    List<Note> findByEmailAndWorkspaceIdIsNullOrderByPinnedDescIdDesc(String email);

    long countByEmail(String email);

    List<Note> findByWorkspaceId(Long workspaceId);

    List<Note> findByWorkspaceIdOrderByPinnedDescIdDesc(Long workspaceId);

}