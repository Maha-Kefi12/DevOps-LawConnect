package tn.esprit.cloud_in_mypocket.entities;

public class PostStatistics {

    private Long id;
    private String name;
    private int viewCount;
    private int likeCount;
    private String postedBy;

    // Constructor to initialize the PostStatistics object from the Post entity
    public PostStatistics(Long id, String name, int viewCount, int likeCount, String postedBy) {
        this.id = id;
        this.name = name;
        this.viewCount = viewCount;
        this.likeCount = likeCount;
        this.postedBy = postedBy;
    }

    // Getters and setters for PostStatistics properties

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getViewCount() {
        return viewCount;
    }

    public void setViewCount(int viewCount) {
        this.viewCount = viewCount;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }

    public String getPostedBy() {
        return postedBy;
    }

    public void setPostedBy(String postedBy) {
        this.postedBy = postedBy;
    }
}
