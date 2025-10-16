package tn.esprit.cloud_in_mypocket.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.cloud_in_mypocket.entities.Comment;
import tn.esprit.cloud_in_mypocket.entities.CommentRequest;
import tn.esprit.cloud_in_mypocket.entities.Post;
import tn.esprit.cloud_in_mypocket.repositories.PostRepository;
import tn.esprit.cloud_in_mypocket.services.CommentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;
    private final PostRepository postRepository;

    @Autowired
    public CommentController(CommentService commentService, PostRepository postRepository) {
        this.commentService = commentService;
        this.postRepository = postRepository;
    }

    // ✅ Create Comment
    @PostMapping("ajouter")
    public ResponseEntity<Comment> createComment(@RequestBody CommentRequest request) {
        Optional<Post> optionalPost = postRepository.findById(request.getPostId());

        if (optionalPost.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Post not found with id: " + request.getPostId());
        }

        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setPostedBy(request.getPostedBy());
        comment.setPost(optionalPost.get());

        Comment savedComment = commentService.saveComment(comment);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedComment);
    }

    // ✅ Update Comment
    @PutMapping("/{id}")
    public ResponseEntity<Comment> updateComment(@PathVariable Long id, @RequestBody Comment updatedComment) {
        try {
            Comment updated = commentService.updateComment(id, updatedComment);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    // ✅ Get single Comment
    @GetMapping("getById/{id}")
    public ResponseEntity<Comment> getComment(@PathVariable Long id) {
        Optional<Comment> optionalComment = commentService.getCommentById(id);

        if (optionalComment.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found with id: " + id);
        }

        return ResponseEntity.ok(optionalComment.get());
    }

    // ✅ Delete Comment
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteCommentById(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ Get all comments (non-paginated)
    @GetMapping("getAll")
    public ResponseEntity<List<Comment>> getAllComments() {
        return ResponseEntity.ok(commentService.getAllComments());
    }

    // ✅ Get paginated comments by post ID
    @GetMapping("/post/{postId}/comments")
    public ResponseEntity<Page<Comment>> getCommentsByPost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Comment> comments = commentService.getCommentsByPostId(postId, pageable);

        return ResponseEntity.ok(comments);
    }


}
