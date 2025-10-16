package tn.esprit.cloud_in_mypocket.entities;

public class CommentRequest {
    private String content;
    private String postedBy;
    private Long postId;  // Only in DTO, not in entity

    // Getters and setters
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getPostedBy() { return postedBy; }
    public void setPostedBy(String postedBy) { this.postedBy = postedBy; }
    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }
}