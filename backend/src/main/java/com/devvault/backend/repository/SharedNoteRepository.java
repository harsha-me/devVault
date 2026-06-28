package com.devvault.backend.repository;

import com.devvault.backend.entity.SharedNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import org.springframework.transaction.annotation.Transactional;

public interface SharedNoteRepository extends JpaRepository<SharedNote, Long> {

    List<SharedNote> findByReceiverEmail(String receiverEmail);
    long countByReceiverEmailAndIsReadFalse(String receiverEmail);
    long countBySenderEmail(String senderEmail);
    @Transactional
    @Modifying
    @Query("UPDATE SharedNote s SET s.isRead = true WHERE s.receiverEmail = :email")
    void markNotesAsRead(String email);

}