package tn.esprit.cloud_in_mypocket.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.cloud_in_mypocket.entities.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByPostId(Long postId, Pageable pageable);
    long countByPostId(Long postId);
}
