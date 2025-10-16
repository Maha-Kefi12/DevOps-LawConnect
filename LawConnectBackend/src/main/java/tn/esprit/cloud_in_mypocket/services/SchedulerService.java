package tn.esprit.cloud_in_mypocket.services;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class SchedulerService {

    private final PostService postService;

    public SchedulerService(PostService postService) {
        this.postService = postService;
    }


    // Run every day at midnight
    @Scheduled(cron = "0 0/5 * * * *")
    public void resetViewsEveryFiveMinutes() {
        System.out.println("🕛 Scheduler triggered every 5 minutes: " + LocalDateTime.now());
        postService.resetDailyViews();
    }


    // Run every 5 minutes
    @Scheduled(cron = "0 */5 * * * *")
    public void logEveryFiveMinutes() {
        System.out.println("⏰ Log every 5 minutes: " + LocalDateTime.now());
    }
}

