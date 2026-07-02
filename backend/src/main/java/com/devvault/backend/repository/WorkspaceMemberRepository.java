package com.devvault.backend.repository;

import com.devvault.backend.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

    List<WorkspaceMember> findByMemberEmail(String memberEmail);

    List<WorkspaceMember> findByWorkspaceId(Long workspaceId);

    WorkspaceMember findByWorkspaceIdAndMemberEmail(Long workspaceId, String memberEmail);

    boolean existsByWorkspaceIdAndMemberEmail(Long workspaceId, String memberEmail);
}
