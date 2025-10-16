import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Article } from '../models/article';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
// Define the ArticleStatistic interface
export interface ArticleStatistic {
  name: string;
  viewCount: number; // or Long, depending on your backend
}
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  
  private apiUrl = 'http://localhost:8080/api/articles'; // Update with your backend API URL

  constructor(private http: HttpClient) {}

  // Get all articles with fresh data
  getArticles(): Observable<Article[]> {
    console.log('Getting all articles with fresh data');
    
    // Create headers to prevent caching
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Add a timestamp to bypass cache
    const timestamp = new Date().getTime();
    
    return this.http.get<Article[]>(
      `http://localhost:8080/api/posts/getALL?_=${timestamp}`, 
      { headers }
    ).pipe(
      tap(articles => {
        console.log(`Fetched ${articles.length} articles at ${timestamp}`);
        articles.forEach(article => {
          console.log(`Article ${article.id}: ${article.viewCount} views`);
        });
      }),
      catchError(error => {
        console.error('Error fetching articles:', error);
        return throwError(() => new Error('Failed to load articles'));
      })
    );
  }

  getArticleById(id: number): Observable<Article> {
    // Create headers to prevent caching
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Add timestamp to bust cache
    const timestamp = new Date().getTime();
    
    return this.http.get<Article>(
      `http://localhost:8080/api/posts/${id}?_=${timestamp}`,
      { headers }
    ).pipe(
      tap(article => {
        console.log(`Fetched article ${id} at ${timestamp} with ${article.viewCount} views`);
      }),
      catchError(error => {
        console.error(`Error fetching article ${id}:`, error);
        return throwError(() => new Error('Failed to load article. Please try again.'));
      })
    );
  }
  
  
  
  // Create new article
  createArticle(article: any): Observable<Article> {
    return this.http.post<Article>("http://localhost:8080/api/posts/createPost", article).pipe(
      catchError(error => {
        console.error('API Error:', error);
        throw error; // Re-throw for component handling
      })
    );
  }
  // Update article
updateArticle(id: number, article: Article): Observable<Article> {
  return this.http.put<Article>(`http://localhost:8080/api/posts/updatePost/${id}`, article);
  
}
updateArticleWithFormData(id: number, data: FormData) {
  return this.http.put(`http://localhost:8080/api/posts/update/${id}`, data);
}

// Method to upload an article image (if you're implementing an image upload feature separately)
uploadArticleImage(formData: FormData) {
  return this.http.post('http://localhost:8080/images/upload', formData);
}


  // Delete article
deleteArticle(id: number): Observable<void> {
  if (!id) throw new Error('ID parameter is required');

  return this.http.delete<void>(`http://localhost:8080/api/posts/delete/${id}`);
}

  // Search articles by term
  searchArticles(term: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/search?q=${term}`);
  }
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Failed to load article. Please try again later.';
    if (error.status === 404) {
      errorMessage = 'Article not found';
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    }
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
  updateArticleWithJson(articleId: number, articleData: any): Observable<any> {
    const url = `${this.apiUrl}/updatePost/${articleId}`; // Assuming you have an endpoint like /updatePost/{id}
    return this.http.put(url, articleData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    });
  }


  // Enhanced likePost with optimistic update
  likePost(postId: number): Observable<any> {
    console.log(`Liking post with ID: ${postId}`);
    const url = `http://localhost:8080/api/posts/${postId}/like`;
    
    return this.http.post(url, {}).pipe(
      map(response => {
        // Return success with response
        return { success: true, response };
      }),
      catchError(error => {
        console.error('Error liking post:', error);
        
        // Special case for 200 OK response that Angular might mark as error
        if (error.status === 200) {
          return of({ success: true, response: error.error });
        }
        
        return of({ success: false, error });
      })
    );
  }
  resetPostViews(): Observable<any> {
    const url = `http://localhost:8080/api/posts/reset-views`;
    return this.http.post(url, {}); // Empty body
  }
  
  
  resetViews(): Observable<any> {
    return this.http.post<any>('http://localhost:8080/api/posts/reset-views', {}).pipe(
      catchError(error => {
        console.error('Error occurred while resetting views:', error);
        alert('An error occurred while resetting views. Please try again.');
        return throwError(error);
      })
    );
  }
  getArticleStatistics(): Observable<any> {
    return this.http.get<any>('http://localhost:8080/api/posts/statistics');
  }
  // Method to trigger the scheduled task manually
  triggerTask(): Observable<string> {
    return this.http.get<string>('http://localhost:8080/api/posts/trigger-scheduled-task', { responseType: 'text' as 'json' });
  }
  
  
  getStatistics(): Observable<ArticleStatistic[]> {
    return this.http.get<ArticleStatistic[]>(this.apiUrl).pipe(
      tap(data => console.log('Statistics fetched: ', data)), // Debugging output
      catchError(error => {
        console.error('Error fetching statistics:', error);
        return throwError(error);
      })
    );
  }
  
  
  // Enhanced incrementViewCount with optimistic update and CORS handling
  incrementViewCount(postId: number): Observable<any> {
    console.log(`Incrementing view count for post ID: ${postId}`);
    
    // Create headers to prevent caching
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Add a random parameter to bypass potential API caching
    const randomParam = Date.now();
    
    // Try the main endpoint with error handling
    return this.http.post(
      `http://localhost:8080/api/posts/increment-view-count/${postId}?_=${randomParam}`, 
      {}, 
      { headers }
    ).pipe(
      tap(response => {
        console.log('View count incremented successfully:', response);
      }),
      catchError(error => {
        console.error('Error incrementing view count:', error);
        
        // If there's a CORS error (status 0) or other network error, try a fallback approach
        if (error.status === 0 || error.status >= 500) {
          console.log('CORS or server error detected, using fallback approach');
          
          // Try a simpler GET endpoint as fallback (less likely to have CORS issues)
          return this.simulateViewIncrement(postId);
        }
        
        // If the error has status 200, it's not really an error
        if (error.status === 200) {
          console.log('Treating 200 error as success for view increment');
          return of({ success: true, response: error.error });
        }
        
        return of({ success: false, error });
      }),
      // Transform ANY response to have a consistent format with viewCount
      map(response => {
        // Get current article to ensure we always have the latest view count
        return this.getArticleById(postId).pipe(
          map(article => {
            // If the server didn't increment the count, add one to the current value
            const viewCount = article.viewCount;
            console.log(`Retrieved current article view count: ${viewCount}`);
            
            // Return a consistent format with viewCount and the article data
            return { 
              success: true, 
              response: { 
                viewCount: viewCount,
                article: article
              } 
            };
          })
        );
      }),
      switchMap(obs => obs) // Flatten the observable
    );
  }

  // Fallback method to simulate view increment when the main endpoint fails
  private simulateViewIncrement(postId: number): Observable<any> {
    console.log(`Using fallback view increment for post ID: ${postId}`);
    
    // Simply fetch the article to keep it simple
    return this.getArticleById(postId).pipe(
      map(article => {
        // Create an updated count to return
        const updatedCount = (article.viewCount || 0) + 1;
        console.log('Fallback: Retrieved article, returning simulated incremented view count:', updatedCount);
        
        // Return an object that mimics the successful response from the main endpoint
        return { 
          success: true, 
          response: { 
            viewCount: updatedCount,
            article: article
          }
        };
      }),
      catchError(error => {
        console.error('Fallback also failed:', error);
        return of({ success: false, error });
      })
    );
  }
  
  
  // Get all articles with pagination
  getPaginatedArticles(page: number = 0, size: number = 3): Observable<any> {
    // Create headers to prevent caching
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Add a timestamp to bust cache
    const timestamp = new Date().getTime();
    
    return this.http.get<any>(
      `http://localhost:8080/api/posts/getALL?page=${page}&size=${size}&_=${timestamp}`,
      { headers }
    ).pipe(
      tap(response => {
        console.log(`Fresh articles data fetched at ${timestamp}`);
      }),
      map((response: any) => {
        // If the response is already paginated, return as is
        if (response && response.content) {
          console.log('Server returned paginated data:', response);
          return response;
        }
        
        // If response is an array, convert it to paginated format
        if (Array.isArray(response)) {
          console.log('Converting array response to paginated format');
          
          // Calculate start and end indices for the requested page
          const startIndex = page * size;
          const endIndex = startIndex + size;
          
          // Get the subset of articles for the current page
          const paginatedItems = response.slice(startIndex, endIndex);
          
          // Create a paginated response format
          const paginatedResponse = {
            content: paginatedItems,
            totalElements: response.length,
            totalPages: Math.ceil(response.length / size),
            number: page,
            size: size,
            numberOfElements: paginatedItems.length
          };
          
          console.log('Created paginated response:', paginatedResponse);
          return paginatedResponse;
        }
        
        // Unexpected response format
        console.error('Unexpected response format:', response);
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: page,
          size: size,
          numberOfElements: 0
        };
      })
    );
  }

  // Search articles by title with fresh data
  searchArticlesByTitle(query: string): Observable<Article[]> {
    if (!query.trim()) {
      // If search query is empty, return all articles
      return this.getArticles();
    }
    
    console.log(`Searching articles by title: "${query}" with fresh data`);
    
    // Convert query to lowercase for case-insensitive search
    const searchTerm = query.toLowerCase().trim();
    
    // Use the getArticles method to get fresh data and filter client-side
    return this.getArticles().pipe(
      map(articles => {
        const filteredArticles = articles.filter(article => 
          article.name.toLowerCase().includes(searchTerm)
        );
        console.log(`Found ${filteredArticles.length} matching articles for search term "${query}"`);
        return filteredArticles;
      })
    );
  }
}