package tn.esprit.cloud_in_mypocket.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tn.esprit.cloud_in_mypocket.entities.ArticleStatistic;
import tn.esprit.cloud_in_mypocket.repositories.PostRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ArticleStatisticService {

    private final PostRepository postRepository;

    @Autowired
    public ArticleStatisticService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public List<ArticleStatistic> getArticleStatistics() {
        return postRepository.findAll().stream()
                .map(post -> new ArticleStatistic(post.getName(), (long) post.getViewCount()))
                .collect(Collectors.toList());
    }

}
