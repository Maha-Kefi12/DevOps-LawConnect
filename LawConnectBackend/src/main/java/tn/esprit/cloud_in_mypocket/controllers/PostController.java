package tn.esprit.cloud_in_mypocket.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.cloud_in_mypocket.entities.ArticleStatistic;
import tn.esprit.cloud_in_mypocket.entities.Post;
import tn.esprit.cloud_in_mypocket.entities.ResponseMessage;
import tn.esprit.cloud_in_mypocket.repositories.PostRepository;
import tn.esprit.cloud_in_mypocket.services.ArticleStatisticService;
import tn.esprit.cloud_in_mypocket.services.PostServiceImpl;
import tn.esprit.cloud_in_mypocket.services.SchedulerService;

import java.util.List;
import java.util.Optional;

@CrossOrigin("http://localhost:4200/")
@RestController
@RequestMapping("/api/posts")
public class PostController {


    private final SchedulerService schedulerService;
    private PostServiceImpl postService;
    private PostRepository postRepository;

    public PostController(ArticleStatisticService articleStatisticService, PostRepository postRepository, PostServiceImpl postService, SchedulerService schedulerService) {
        this.articleStatisticService = articleStatisticService;
        this.postRepository = postRepository;
        this.postService = postService;
        this.schedulerService = schedulerService;
    }

    private ArticleStatisticService articleStatisticService;

@PostMapping("/createPost")
    public ResponseEntity<?> savePost(@RequestBody Post post) {
        postService.savePost(post);
        return ResponseEntity.ok("Post saved successfully");
    }
    @GetMapping("/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        Post post = postService.getPostById(id);
        return ResponseEntity.ok(post);
    }

    @GetMapping("/getALL")
    public ResponseEntity<?> getAllPosts() {
        List<Post> posts = postService.getAllPosts();
        return ResponseEntity.ok(posts);
    }

    @PutMapping("/updatePost/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Long id, @RequestBody Post postRequest) {
        Post existingPost = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        existingPost.setName(postRequest.getName());
        existingPost.setContent(postRequest.getContent());
        existingPost.setPostedBy(postRequest.getPostedBy());
        existingPost.setTags(postRequest.getTags());
        existingPost.setImg(postRequest.getImg()); // ✅ important
        // Do NOT reset likeCount/viewCount unless needed

        Post updated = postRepository.save(existingPost);
        return ResponseEntity.ok(updated);
    }


    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        Optional<Post> post = postRepository.findById(id);
        if (post.isPresent()) {
            postRepository.deleteById(id); // Delete the post from the repository
            return ResponseEntity.ok().build();  // Return 200 OK when successful
        } else {
            return ResponseEntity.notFound().build();  // Return 404 if post not found
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable Long id) {
        try {
            Post likedPost = postService.likePost(id);
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body("✅ Post liked successfully. Total likes: " + likedPost.getLikeCount());
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("❌ Error: " + e.getMessage());
        }
    }
    @PostMapping("/reset-views")
    public ResponseEntity<?> resetViews() {
        try {
            postService.resetDailyViews();
            return ResponseEntity.ok(new ResponseMessage("Views reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ResponseMessage("Failed to reset views"));
        }
    }
    // Endpoint to trigger task manually
    @GetMapping("/trigger-scheduled-task")
    public ResponseEntity<String> triggerScheduledTask() {
        try {
            schedulerService.logEveryFiveMinutes(); // Trigger your task here
            return ResponseEntity.ok("Task triggered manually!"); // Return a proper success message
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error triggering task: " + e.getMessage());
        }
    }


    @GetMapping("/statistics")
    public ResponseEntity<List<ArticleStatistic>> getArticleStatistics() {
        List<ArticleStatistic> stats = articleStatisticService.getArticleStatistics();
        return ResponseEntity.ok(stats);
    }
    @PutMapping("/increment-view-count/{postId}")
    public ResponseEntity<String> incrementViewCount(@PathVariable Long postId) {
        Optional<Post> postOptional = postRepository.findById(postId);
        if (postOptional.isPresent()) {
            Post post = postOptional.get();
            post.setViewCount(post.getViewCount() + 1);
            postRepository.save(post);
            return ResponseEntity.ok("View count incremented");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Post not found");
        }
    }







}



