package tn.esprit.cloud_in_mypocket.services;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import tn.esprit.cloud_in_mypocket.entities.Post;
import tn.esprit.cloud_in_mypocket.entities.PostStatistics;
import tn.esprit.cloud_in_mypocket.repositories.PostRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl  implements PostService {
    public PostServiceImpl(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    private PostRepository postRepository;

    public Post savePost(Post post) {
        post.setLikeCount(0);
        post.setViewCount(0);
        post.setDate(new Date());
        return postRepository.save(post);
    }

    public Post getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        post.setViewCount(post.getViewCount() + 1);
        return post;
    }


    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public Post updatePost(Long id, Post post) {
        Post existingPost = getPostById(id);
        existingPost.setName(post.getName());
        existingPost.setContent(post.getContent());
        // set other fields as needed
        return postRepository.save(existingPost);
    }

    public void deletePost(Long id) {
        Post post = getPostById(id);
        postRepository.delete(post);
    }

    public Post likePost(Long postId) {
        Optional<Post> optionalPost = postRepository.findById(postId);
        if (optionalPost.isPresent()) {
            Post post = optionalPost.get();
            post.setLikeCount(post.getLikeCount() + 1);
            return postRepository.save(post);
        } else {
            throw new RuntimeException("Post with ID " + postId + " not found");
        }
    }

    @Transactional
    public void resetDailyViews() {
        List<Post> posts = postRepository.findAll();
        for (Post post : posts) {
            post.setViewCount(0);
        }
        postRepository.saveAll(posts);
        System.out.println("✅ Daily post views reset.");
    }
    public List<PostStatistics> getPostStatistics() {
        // Fetch all posts from the database
        List<Post> posts = postRepository.findAll();

        // Convert each Post to a PostStatistics object
        return posts.stream()
                .map(post -> new PostStatistics(
                        post.getId(),
                        post.getName(),
                        post.getViewCount(),
                        post.getLikeCount(),
                        post.getPostedBy()))
                .collect(Collectors.toList());
    }
    public void incrementViewCount(Long postId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        post.setViewCount(post.getViewCount() + 1); // Increment view count
        postRepository.save(post); // Save the updated post
    }

}

