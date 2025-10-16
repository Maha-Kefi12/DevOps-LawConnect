package tn.esprit.cloud_in_mypocket.entities;

import jakarta.persistence.*;

@Entity
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String content;
    private String postedBy;
    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;
    // Add these required methods
    public Post getPost() {
        return this.post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    // Keep your existing getters/setters
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getPostedBy() { return postedBy; }
    public void setPostedBy(String postedBy) { this.postedBy = postedBy; }

}
