package com.devvault.backend.repository;

import com.devvault.backend.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByEmail(String email);

    List<Note> findByEmailOrderByPinnedDescIdDesc(String email);

    long countByEmail(String email);

}