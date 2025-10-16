package tn.esprit.cloud_in_mypocket.services;

import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import tn.esprit.cloud_in_mypocket.entities.Comment;
import tn.esprit.cloud_in_mypocket.repositories.CommentRepository;
import tn.esprit.cloud_in_mypocket.repositories.PostRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CommentServiceImpl implements CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    public CommentServiceImpl(CommentRepository commentRepository, PostRepository postRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
    }


    @Override
    public Comment saveComment(Comment comment) {
        return commentRepository.save(comment);
    }

    @Override
    public Optional<Comment> getCommentById(Long id) {
        return commentRepository.findById(id);

    }

    @Override
    public List<Comment> getAllComments() {
        return List.of();
    }

    @Override
    public Page<Comment> findByPostId(Long postId, Pageable pageable) {
        return commentRepository.findByPostId(postId, pageable);
    }

    @Override
    public Page<Comment> getCommentsByPostId(Long postId, Pageable pageable) {
        return commentRepository.findByPostId(postId, pageable);
    }

    @Override
    public Comment updateComment(Long id, Comment updatedComment) {
        return commentRepository.save(updatedComment);
    }

    @Override
    public void deleteCommentById(Long id) {
        commentRepository.deleteById(id);

    }

    @Override
    public boolean existsById(Long id) {
        return commentRepository.existsById(id);
    }

    @Override
    public long countCommentsByPostId(Long postId) {
        return commentRepository.countByPostId(postId);

    }
}