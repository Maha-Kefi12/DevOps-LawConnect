import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../models/comment';
import { HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private baseApiUrl = 'http://localhost:8080/api/comments'; // Base URL

  constructor(private http: HttpClient) { }

  // Create a new comment - POST to /ajouter
  createComment(commentData: { content: string, postedBy: string, postId: number }): Observable<Comment> {
    // Structure matches your CommentRequest DTO
    const payload = {
      content: commentData.content,
      postedBy: commentData.postedBy,
      postId: commentData.postId
    };
    
    return this.http.post<Comment>(`${this.baseApiUrl}/ajouter`, payload);
  }
  
  // Alias for createComment to maintain compatibility
  saveComment(comment: Comment): Observable<Comment> {
    // Extract the required fields for createComment
    const commentData = {
      content: comment.content,
      postedBy: comment.postedBy,
      postId: comment.post?.id || this.extractPostIdFromComment(comment)
    };
    
    return this.createComment(commentData);
  }

  // Helper method to extract postId from comment
  private extractPostIdFromComment(comment: Comment): number {
    // Try to get postId from various possible locations
    if (comment.article?.id) {
      return comment.article.id;
    }
    
    // If we can't find a postId, use a default or throw an error
    console.error('Could not extract postId from comment:', comment);
    return 0; // Default value, change as needed
  }

  // Update an existing comment - PUT to /commentId
  updateComment(commentId: number | string, commentData: { content: string, postedBy: string, postId?: number }): Observable<Comment> {
    if (!commentId) {
      console.error('Invalid comment ID for update:', commentId);
      return throwError(() => new Error('Invalid comment ID for update'));
    }
    
    // Create a clean payload with only the expected fields
    const payload: Record<string, any> = {
      id: commentId,
      content: commentData.content,
      postedBy: commentData.postedBy,
      postId: commentData.postId
    };
    
    // Remove any undefined values that might cause issues
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    const url = `${this.baseApiUrl}/${commentId}`;
    console.log('Update comment URL:', url);
    console.log('Update comment data:', payload);
    
    return this.http.put<Comment>(url, payload)
      .pipe(
        catchError(error => {
          console.error('Error in comment update service:', error);
          console.error('Response body:', error.error);
          return throwError(() => error);
        })
      );
  }

  // Delete a comment - DELETE to /commentId
  deleteComment(comment: Comment): Observable<void> {
    const commentId = comment.id || comment._id || comment.commentId || comment.post?.id;
    if (!commentId) {
      console.error('Comment ID is missing');
      throw new Error('Comment ID is missing');
    }
    return this.deleteCommentById(commentId);
  }
  
  // Get a single comment by ID - GET to /getById/commentId
  getComment(id: number): Observable<Comment> {
    return this.http.get<Comment>(`${this.baseApiUrl}/getById/${id}`);
  }

  // Get all comments - GET to /getAll
  getAllComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(`http://localhost:8080/api/comments/getAll`);
  }

  // Get comments by post ID - GET to /post/postId/comments with pagination
  getCommentsByPostId(postId: number, page: number = 0, size: number = 5): Observable<any> {
    return this.http.get<any>(
      `${this.baseApiUrl}/post/${postId}/comments?page=${page}&size=${size}`
    );
  }
  
  // Delete a comment by ID - DELETE to /commentId
  deleteCommentById(id: number | string): Observable<void> {
    if (!id) {
      return throwError(() => new Error('Invalid comment ID: ' + id));
    }
    
    return this.http.delete<void>(`${this.baseApiUrl}/${id}`);
  }

  // Add a new method for direct update with extensive debugging and multiple formats
  updateCommentDirect(commentId: number | string, commentData: any): Observable<any> {
    if (!commentId) {
      console.error('Invalid comment ID for direct update:', commentId);
      return throwError(() => new Error('Invalid comment ID for direct update'));
    }
    
    // Ensure ID is included in the payload
    const payload = {
      ...commentData,
      id: commentId
    };
    
    // Add headers for better server compatibility
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Standard URL format
    const url = `${this.baseApiUrl}/${commentId}`;
    console.log('Direct update - URL:', url);
    console.log('Direct update - payload:', payload);
    
    return this.http.put(url, payload, { headers })
      .pipe(
        catchError(error => {
          console.error('Error updating comment with standard URL:', error);
          
          // If 404 error, try alternative URL format
          if (error.status === 404) {
            console.log('Standard URL failed with 404, trying alternative URL...');
            return this.updateCommentWithAlternativeUrl(payload);
          }
          
          return throwError(() => error);
        })
      );
  }

  // Helper method for trying alternative URL format
  private updateCommentWithAlternativeUrl(payload: any): Observable<any> {
    // Alternative format: just PUT to /comments without ID in URL
    const altUrl = this.baseApiUrl;
    console.log('Alternative update - URL:', altUrl);
    console.log('Alternative update - payload:', payload);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    return this.http.put(altUrl, payload, { headers })
      .pipe(
        catchError(error => {
          console.error('Error updating comment with alternative URL:', error);
          return throwError(() => error);
        })
      );
  }
}
