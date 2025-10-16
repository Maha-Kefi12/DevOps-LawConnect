package tn.esprit.cloud_in_mypocket.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.cloud_in_mypocket.entities.Post;
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
}
