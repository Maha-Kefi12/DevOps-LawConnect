package tn.esprit.cloud_in_mypocket.entities;

public class ArticleStatistic {
    private String name;
    private Long viewCount;

    public ArticleStatistic() {
    } // default constructor for JSON serialization

    public ArticleStatistic(String name, Long viewCount) {
        this.name = name;
        this.viewCount = viewCount;
    }


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getViewCount() {
        return viewCount;
    }

    public void setViewCount(Long viewCount) {
        this.viewCount = viewCount;
    }
}



