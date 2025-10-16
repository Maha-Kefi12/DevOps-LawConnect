package tn.esprit.cloud_in_mypocket.services;

import tn.esprit.cloud_in_mypocket.entities.Post;

import java.util.List;

public interface PostService {
    Post savePost(Post post);
    Post getPostById(Long id);
    List<Post> getAllPosts();
    Post updatePost(Long id, Post post);
    void deletePost(Long id);
    Post likePost(Long postId);

    void resetDailyViews();
}
