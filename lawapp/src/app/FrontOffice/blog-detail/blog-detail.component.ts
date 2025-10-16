// blog-detail.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { Article } from '../../models/article';
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { CommentService } from 'src/app/services/comment.service';
import { Comment } from 'src/app/models/comment';
import { HttpClient } from '@angular/common/http';
import { PerspectiveService } from 'src/app/services/perspective.service';
import { Chart, registerables } from 'chart.js';
import { finalize } from 'rxjs/operators';

Chart.register(...registerables);

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.css']
})
export class BlogDetailComponent implements OnInit {
  article?: Article;
  isLoading = true;
  errorMessage = '';
  successMessage: string = '';
  postId: number = 1;
  private apiUrl = 'http://localhost:8080/api';
  commentForm: FormGroup;
  editCommentForm: FormGroup;
  comments: Comment[] = [];
  isSubmittingComment = false;
  statistics: any[] = [];
  message: string = '';
  articleStatistics: any[] = [];
  editingCommentId: number | string | null = null;
  currentComment: Comment | null = null;
  currentPage: number = 0;
  pageSize: number = 5;
  totalComments: number = 0;
  totalPages: number = 0;
  isToxicityChecking = false; // New property for toxicity check state
  toxicityDetected = false; // New property to track if toxicity was detected
  toxicityScore = 0; // New property to track toxicity score

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private articleService: ArticleService,
    private commentService: CommentService, 
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private perspectiveService: PerspectiveService // Add the Perspective service
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(3)]],
      postedBy: ['', [Validators.required]]
    });
    
    this.editCommentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(3)]],
      postedBy: ['', [Validators.required]]
    });
  }
  ngOnInit(): void {
    this.getStatistics();
    this.loadStatistics();
    
    // Use route.params subscription to handle both initial load and navigation between articles
    this.route.params.subscribe(params => {
      const postId = params['id']; // Getting the postId from the URL params
      this.postId = postId;
      
      if (postId) {
        // Load the article first
        this.loadArticle().then(() => {
          // Then increment the view count after article is loaded
          if (this.article) {
            this.incrementViewCount(postId);
          }
        });
        
        this.getPostDetails(postId);
        this.loadComments(0); // Reset to first page when loading a new article
      }
    });
  }

  loadArticle(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id || isNaN(+id)) {
      this.errorMessage = 'Invalid article ID';
      this.isLoading = false;
      return Promise.resolve();
    }

    this.isLoading = true;
    
    return new Promise<void>((resolve) => {
      this.articleService.getArticleById(+id).subscribe({
        next: (article) => {
          this.article = article;
          this.isLoading = false;
          console.log('Article loaded with view count:', article.viewCount);
          this.cdr.detectChanges(); // Force change detection
          resolve();
        },
        error: (err) => {
          console.error('Error fetching article:', err);
          this.errorMessage = 'Failed to load article. Please try again later.';
          this.isLoading = false;
          resolve();
        }
      });
    });
  }

  getSafeImageUrl(url: string | undefined): string {
    return url || 'assets/FrontOffice/img/blog/WhatsApp_Image_2025-04-05_at_5.45.49_PM__2_-removebg-preview.png'; // Path relative to src/assets
  }
  
  
  deleteArticle(): void {
    if (!this.article?.id) {
      console.error('Delete failed: No article ID');
      return;
    }
  
    const confirmDelete = confirm("Are you sure you want to delete this article?");
    if (!confirmDelete) return;
  
    this.articleService.deleteArticle(this.article.id).subscribe({
      next: () => {
        alert("Article deleted successfully.");
        this.router.navigate(['/blogs']); // Navigate back to blog list
      },
      error: (err) => {
        console.error("Delete error:", err);
        alert("Failed to delete the article.");
      }
    });
  }
  
  goToUpdateForm(): void {
    if (!this.article) return;
    this.router.navigate(['/blogs/form-data'], {
      queryParams: { id: this.article.id }
    });
  }
  

  incrementViewCount(postId: number): void {
    console.log(`Incrementing view count for post ID: ${postId}`);
    
    if (!this.article) {
      console.warn('Cannot increment view count: article not loaded');
      return;
    }
    
    // Store original value and increment optimistically
    const originalViewCount = this.article.viewCount || 0;
    
    // Update the view count
    this.article.viewCount = originalViewCount + 1;
    console.log(`Optimistically updated view count from ${originalViewCount} to ${this.article.viewCount}`);
    
    // Force change detection to update the view
    this.cdr.detectChanges();
    
    // Force a delay (50ms) to ensure the request isn't dropped due to rapid navigation
    setTimeout(() => {
      this.articleService.incrementViewCount(postId).subscribe({
        next: (response) => {
          console.log('View count increment successful, full response:', response);
          
          // Update the view count in the UI
          if (this.article) {
            // Check for viewCount in the response
            if (response && response.response && response.response.viewCount !== undefined) {
              this.article.viewCount = response.response.viewCount;
              console.log(`Updated view count to ${this.article.viewCount} from response`);
              
              // If the response also includes an updated article, we can update any other article properties
              if (response.response.article) {
                // Update other article properties while preserving the current view
                const viewCount = this.article.viewCount;
                Object.assign(this.article, response.response.article);
                // Ensure we keep our updated view count
                this.article.viewCount = viewCount;
                console.log('Updated article with latest data from server');
              }
            } else if (response && typeof response.viewCount !== 'undefined') {
              // Direct viewCount property on response
              this.article.viewCount = response.viewCount;
              console.log(`Updated view count to ${this.article.viewCount} from direct response property`);
            } else if (response && typeof response === 'object') {
              // Log all properties of the response for debugging
              console.log('Response properties:', Object.keys(response));
              console.log('No standard viewCount found in response, keeping optimistic update');
            } else {
              console.log('No view count in response, keeping optimistic update');
            }
            
            // Force change detection to update the view
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error incrementing view count:', error);
          
          // Check for CORS error
          if (error.status === 0) {
            console.warn('CORS error detected. View count may not update on the server but will keep optimistic update in UI.');
            // Keep the optimistic update visible to the user
            // Force change detection to ensure it's displayed
            this.cdr.detectChanges();
            return;
          }
          
          // For other errors, revert the optimistic update
          if (this.article) {
            this.article.viewCount = originalViewCount;
            console.log(`Reverted view count to original: ${originalViewCount}`);
            // Force change detection
            this.cdr.detectChanges();
          }
        }
      });
    }, 50);
  }

  onLikeClick(postId: number): void {
    if (!this.article) return;

    // Store the original count in case we need to revert
    const originalLikesCount = this.article.likeCount || 0;

    // Optimistically update the UI
    this.article.likeCount = (this.article.likeCount || 0) + 1;
    
    // Add animation class to the like button
    document.querySelector('.like-btn')?.classList.add('liked');

    this.articleService.likePost(postId).subscribe({
      next: (response) => {
        // Success - update the like count with the real value if provided
        console.log('Like successful:', response);
        
        // You could update with a real value from response if the API returns it
        // this.article!.likeCount = response.likeCount || (originalLikesCount + 1);
        
        // Show a temporary success message
        this.successMessage = 'You liked this article!';
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        console.error('Error liking post:', error);
        
        // Special case: If the API returns 200 but Angular marks it as error
        if (error.status === 200) {
          // Show success message
          this.successMessage = 'You liked this article!';
          setTimeout(() => this.successMessage = '', 2000);
        } else {
          // Revert the UI change if the request fails
          this.article!.likeCount = originalLikesCount;
          // Remove animation class
          document.querySelector('.like-btn')?.classList.remove('liked');
          // Show error message
          this.errorMessage = 'Failed to like the article. Please try again.';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      }
    });
  }

  onSubmitComment(): void {
    if (this.commentForm.invalid) return;
    
    // Clear any previous error messages
    this.errorMessage = '';
    this.toxicityDetected = false;
    
    // Show toxicity checking state
    this.isToxicityChecking = true;
    
    // Get the comment content
    const commentContent = this.commentForm.value.content;
    
    // First check for toxicity
    // Use mock service for testing or actual service for production
    this.perspectiveService.analyzeTextMock(commentContent)
      .pipe(
        finalize(() => {
          this.isToxicityChecking = false;
          this.cdr.detectChanges(); // Update UI
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Toxicity analysis result:', result);
          this.toxicityScore = result.score;
          
          if (result.isToxic) {
            // Toxicity detected - show error and don't submit
            this.toxicityDetected = true;
            this.errorMessage = 'Your comment contains inappropriate content. Please revise it before submitting.';
            return;
          }
          
          // If not toxic, proceed with comment submission
          this.submitSafeComment();
        },
        error: (err) => {
          console.error('Error checking toxicity:', err);
          // If error in toxicity check, allow submission but log the error
          this.submitSafeComment();
        }
      });
  }
  
  // New method to handle the actual comment submission after toxicity check
  private submitSafeComment(): void {
    this.isSubmittingComment = true;
    this.errorMessage = ''; // Clear any existing error message

    // Create payload matching your DTO structure
    const commentPayload = {
      content: this.commentForm.value.content,
      postedBy: this.commentForm.value.postedBy,
      postId: this.postId  // Send postId separately
    };

    // Use the updated endpoint through the service
    this.commentService.createComment(commentPayload).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.commentForm.reset();
        this.successMessage = 'Comment added successfully!';
        this.errorMessage = ''; // Ensure error message is cleared
        setTimeout(() => this.successMessage = '', 3000);
        this.isSubmittingComment = false;
        this.loadComments(); // Refresh comments list
      },
      error: (err) => {
        console.error('Error adding comment:', err);
        this.errorMessage = err.error?.message || 'Failed to add comment. Please try again.';
        this.isSubmittingComment = false;
      }
    });
  }

  loadComments(page: number = 0) {
    this.currentPage = page;
    
    // Set loading state
    this.isSubmittingComment = true;
    
    console.log(`Loading comments for post ${this.postId}, page ${page}, size ${this.pageSize}`);
    
    // Set a timeout to avoid infinite loading
    const loadingTimeoutId = setTimeout(() => {
      // If still loading after 10 seconds, clear the loading state
      if (this.isSubmittingComment) {
        console.log('Comment loading timed out');
        this.isSubmittingComment = false;
        this.errorMessage = 'Loading comments timed out. Please try again.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    }, 10000);
    
    this.commentService.getCommentsByPostId(this.postId, page, this.pageSize).subscribe({
      next: (response) => {
        // Clear the timeout as we got a response
        clearTimeout(loadingTimeoutId);
        
        // Clear loading state
        this.isSubmittingComment = false;
        
        console.log('API Response:', response);
        
        // Extract pagination information from response
        if (response.content) {
          // If response is paginated (Spring Data format)
          this.comments = response.content;
          this.totalComments = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          console.log(`Loaded ${this.comments.length} comments. Total: ${this.totalComments}, Pages: ${this.totalPages}`);
        } else if (Array.isArray(response)) {
          // If response is just an array of comments
          this.comments = response;
          this.totalComments = response.length; // Set totalComments to match array length
          this.totalPages = Math.ceil(response.length / this.pageSize) || 1; // Calculate pages
          console.log(`Loaded ${this.comments.length} comments (non-paginated response)`);
        } else {
          console.error('Unexpected response format:', response);
          this.comments = [];
          this.totalComments = 0;
          this.totalPages = 0;
        }
        
        // Process comments to ensure each has a usable ID
        this.comments = this.comments.map(comment => {
          // Check if the comment already has an ID
          if (!comment.id && !comment._id && !comment.commentId) {
            // If no ID, try to use the post.id if available
            if (comment.post?.id) {
              console.log('Using post.id as fallback for comment ID:', comment.post.id);
              comment.commentId = comment.post.id;
            }
          }
          
          // Log each comment's ID properties for debugging
          console.log('Comment:', comment.content, 'ID:', comment.id, '_id:', comment._id, 'commentId:', comment.commentId, 'post.id:', comment.post?.id);
          
          return comment;
        });
        
        if (this.comments.length > 0) {
          console.log('First comment ID:', this.comments[0]?.id || this.comments[0]?._id || this.comments[0]?.commentId || this.comments[0]?.post?.id);
        } else {
          console.log('No comments found for this post');
        }
        
        // Force UI update
        this.cdr.detectChanges();
      },
      error: (err) => {
        // Clear the timeout as we got a response
        clearTimeout(loadingTimeoutId);
        
        // Clear loading state
        this.isSubmittingComment = false;
        
        console.error('Failed to load comments:', err);
        this.errorMessage = 'Failed to load comments: ' + (err.error?.message || 'Unknown error');
        setTimeout(() => this.errorMessage = '', 5000);
        
        // Force UI update
        this.cdr.detectChanges();
      }
    });
  }
  
  deleteComment(comment: Comment): void {
    // Try multiple possible ID fields
    const commentId = comment.id || comment._id || comment.commentId;
    
    if (!commentId) {
      console.error('Comment missing ID:', comment);
      this.showError('This comment cannot be deleted - missing identifier');
      return;
    }
  
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
  
    this.http.delete(`http://localhost:8080/api/comments/${commentId}`)
      .subscribe({
        next: () => {
          this.showSuccess('Comment deleted!');
          this.removeCommentFromList(commentId);
        },
        error: (err) => {
          console.error('Delete failed:', err);
          this.showError(err.error?.message || 'Failed to delete comment');
        }
      });
  }
  
  private removeCommentFromList(id: number|string): void {
    this.comments = this.comments.filter(c => 
      c.id !== id && 
      c.id !== id && 
      c.id !== id
    );
  }
  
  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 5000);
  }
  
  private showSuccess(message: string): void {
    // Implement your success notification
  }


  logCommentId(comment: Comment): void {
    console.log('Comment object:', comment);
    
    // Check all possible ID fields, including post.id
    const commentId = comment.id || comment._id || comment.commentId || comment.post?.id;
    
    if (!commentId) {
      console.error('Comment ID is missing', comment);
      this.errorMessage = 'Comment ID is missing. Try refreshing the page.';
      
      // Try to load comments to ensure we have fresh data
      this.loadComments();
      return;
    }
    
    // Confirm deletion with the user
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    // Set loading state
    this.isSubmittingComment = true;
    
    // Optimistically remove from UI first
    this.removeCommentFromLocalList(commentId);
    
    // Use the found ID
    this.deleteCommentByIndex(commentId);
  }
  
  // Remove a comment from the local list without making an API call
  private removeCommentFromLocalList(id: number | string): void {
    console.log('Removing comment with ID', id, 'from local list');
    console.log('Before removal:', this.comments.length, 'comments');
    
    this.comments = this.comments.filter(comment => {
      const commentId = comment.id || comment._id || comment.commentId || comment.post?.id;
      return commentId != id; // Use loose comparison to handle numeric/string ID differences
    });
    
    console.log('After removal:', this.comments.length, 'comments');
  }

  deleteCommentByIndex(commentId: number | string): void {
    if (!commentId) {
      console.error('Invalid comment ID:', commentId);
      return; // Prevent execution if the ID is invalid
    }
    
    console.log('Attempting to delete comment with ID:', commentId);
    
    // Variable to track if we should show loading state
    let deleteInProgress = true;
    
    // Set a timeout to reset loading state if the request takes too long
    const timeoutId = setTimeout(() => {
      if (deleteInProgress) {
        console.log('Delete operation timed out');
        this.isSubmittingComment = false;
        this.errorMessage = 'Request timed out. The comment may have been deleted.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    }, 10000); // 10 second timeout
    
    // Call the service to delete the comment
    this.commentService.deleteCommentById(Number(commentId)).subscribe({
      next: () => {
        deleteInProgress = false;
        clearTimeout(timeoutId);
        
        console.log('Comment deleted successfully');
        this.successMessage = 'Comment deleted successfully!';
        setTimeout(() => this.successMessage = '', 3000);
        this.isSubmittingComment = false;
        // No need to reload comments as we've already updated the UI
      },
      error: (error) => {
        deleteInProgress = false;
        clearTimeout(timeoutId);
        
        console.error('Error deleting comment:', error);
        this.errorMessage = 'Failed to delete comment. ' + (error.error?.message || 'Please try again.');
        setTimeout(() => this.errorMessage = '', 5000);
        
        // Reset loading state
        this.isSubmittingComment = false;
        
        // Check if it's a 404 error (comment not found)
        if (error.status === 404) {
          // Comment likely already deleted, so no need to restore
          this.successMessage = 'Comment was already removed.';
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          // For other errors, reload comments to restore the UI state since deletion failed
          this.loadComments();
        }
      }
    });
  }
  
  loadStatistics(): void {
    this.articleService.getStatistics().subscribe(
      data => {
        console.log('Statistics loaded:', data); // Log the fetched data
        this.statistics = data;
      },
      error => {
        console.error('Error loading statistics:', error);
      }
    );
  }

  onResetViewsClick() {
    this.articleService.resetViews().subscribe(
      (response) => {
        if (response && response.message === 'Views reset successfully') {
          alert('Views have been reset!');
        } else {
          alert('Failed to reset views.');
        }
      },
      (error) => {
        console.error('Error:', error);
        alert('There was an error while resetting views.');
      }
    );
  }
  triggerTask(): void {
    this.articleService.triggerTask().subscribe({
      next: (response) => {
        console.log('Task triggered successfully:', response);
        this.successMessage = 'Task triggered successfully: ' + response;  // Show the success message

        // After the task is triggered, reset the views
        this.articleService.resetViews().subscribe({
          next: (resetResponse) => {
            console.log('Views reset successfully:', resetResponse);
            //alert('Views have been reset!');

             // Reload the article to update the view count
            this.loadArticle();

          },
          error: (resetError) => {
            console.error('Error resetting views:', resetError);
            this.errorMessage = 'Error resetting views: ' + resetError.message;
            setTimeout(() => this.errorMessage = '', 3000);
            //alert('Failed to reset views.');
          }
        });
      },
      error: (error) => {
        console.error('Error triggering task:', error);
        this.errorMessage = 'Error triggering task: ' + error.message;  // Show the error alert here
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }
  getStatistics(): void {
    this.articleService.getArticleStatistics().subscribe({
      next: (data) => {
        this.articleStatistics = data;
        console.log('📊 Stats loaded:', data);
      },
      error: (error) => {
        console.error('❌ Error loading statistics:', error);
      }
    });
  
  
  }
  getPostDetails(postId: number): void {
    this.articleService.getArticleById(postId).subscribe({
      next: (article) => {
        this.article = article;
        console.log('📄 Post details loaded:', article);
      },
      error: (error) => {
        console.error('❌ Error loading post details:', error);
      }
    });
  }
  
  // Get a usable ID from a comment object
  getCommentId(comment: Comment): number | string | null {
    return comment.id || comment._id || comment.commentId || comment.post?.id || null;
  }
  
  // Start editing a comment
  editComment(comment: Comment): void {
    const commentId = this.getCommentId(comment);
    if (!commentId) {
      this.errorMessage = 'Cannot edit this comment - missing identifier';
      return;
    }
    
    this.editingCommentId = commentId;
    this.currentComment = comment;
    
    // Initialize the edit form with the comment values
    this.editCommentForm.setValue({
      content: comment.content,
      postedBy: comment.postedBy
    });
  }
  
  // Update the comment
  updateComment(): void {
    if (this.editCommentForm.invalid || !this.editingCommentId) {
      return;
    }
    
    this.isSubmittingComment = true;
    
    // Get the original comment for reference
    const commentIndex = this.findCommentIndex(this.editingCommentId);
    const originalComment = commentIndex >= 0 ? {...this.comments[commentIndex]} : null;
    
    console.log('Original comment:', originalComment);
    
    // Create payload with all possible fields
    const commentData: Record<string, any> = {
      id: this.editingCommentId,
      content: this.editCommentForm.value.content,
      postedBy: this.editCommentForm.value.postedBy,
      postId: this.postId
    };
    
    // If we have the original comment, preserve any additional fields that might be needed
    if (originalComment) {
      if (originalComment.post) commentData['post'] = originalComment.post;
      if (originalComment.article) commentData['article'] = originalComment.article;
      // Add any other fields that might be needed
    }
    
    console.log('Attempting to update comment with ID:', this.editingCommentId);
    console.log('Complete update payload:', commentData);
    
    // Update locally for better UX
    if (commentIndex >= 0) {
      // Update the local copy
      this.comments[commentIndex].content = commentData['content'];
      this.comments[commentIndex].postedBy = commentData['postedBy'];
    }
    
    // Use our enhanced service method that tries multiple URL formats
    this.commentService.updateCommentDirect(this.editingCommentId, commentData)
      .subscribe({
        next: (response) => {
          console.log('Comment updated successfully:', response);
          this.successMessage = 'Comment updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
          this.cancelEdit();
          // Reload comments to ensure everything is in sync
          this.loadComments(this.currentPage);
          this.isSubmittingComment = false;
        },
        error: (err) => {
          console.error('Error updating comment:', err);
          
          // Restore original comment if we have it
          if (originalComment && commentIndex >= 0) {
            this.comments[commentIndex] = originalComment;
          }
          
          // Include more specific error information
          if (err.status === 404) {
            this.errorMessage = 'Comment not found. ID: ' + this.editingCommentId;
          } else if (err.status === 400) {
            this.errorMessage = 'Invalid comment data: ' + (err.error?.message || 'Please check your input.');
          } else if (err.status === 500) {
            this.errorMessage = 'Server error: ' + (err.error?.message || err.error?.error || 'Internal server error');
          } else {
            this.errorMessage = 'Failed to update comment: ' + (err.error?.message || 'Please try again.');
          }
          
          setTimeout(() => this.errorMessage = '', 5000);
          this.isSubmittingComment = false;
          
          // Reload comments to restore the UI state since update failed
          this.loadComments(this.currentPage);
        }
      });
  }
  
  // Find a comment by its ID in the local comments array
  private findCommentIndex(commentId: number | string): number {
    return this.comments.findIndex(comment => {
      const id = comment.id || comment._id || comment.commentId || comment.post?.id;
      return id == commentId; // Use loose comparison to handle numeric/string ID differences
    });
  }
  
  // Cancel editing
  cancelEdit(): void {
    this.editingCommentId = null;
    this.currentComment = null;
    this.editCommentForm.reset();
  }

  // Go to next page of comments
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.loadComments(this.currentPage + 1);
    }
  }

  // Go to previous page of comments
  prevPage(): void {
    if (this.currentPage > 0) {
      this.loadComments(this.currentPage - 1);
    }
  }

  // Go to a specific page of comments
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadComments(page);
    }
  }

  // Handle image loading errors
  handleImageError(img: any): void {
    // Create a gradient background for the image element
    if (img) {
      // Remove the image but keep the container
      img.style.display = 'none';
      img.parentElement.classList.add('image-error');
    }
  }
}
