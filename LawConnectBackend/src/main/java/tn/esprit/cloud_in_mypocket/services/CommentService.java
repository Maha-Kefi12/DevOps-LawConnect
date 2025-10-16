package tn.esprit.cloud_in_mypocket.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import tn.esprit.cloud_in_mypocket.entities.Comment;

import java.util.List;
import java.util.Optional;

public interface CommentService {
// Create
Comment saveComment(Comment comment);

        // Read
        Optional<Comment> getCommentById(Long id);
        List<Comment> getAllComments();
    Page<Comment> findByPostId(@Param("postId") Long postId, Pageable pageable);

        // Update
        Comment updateComment(Long id, Comment updatedComment);

        // Delete
        void deleteCommentById(Long id);

        // Additional business logic methods
        boolean existsById(Long id);
        long countCommentsByPostId(Long postId);

    Page<Comment> getCommentsByPostId(Long postId, Pageable pageable);
}
