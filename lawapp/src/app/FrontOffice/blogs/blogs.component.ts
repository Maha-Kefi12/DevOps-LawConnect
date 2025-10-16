import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ArticleService } from 'src/app/services/article.service';
import { Article } from 'src/app/models/article';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter, tap } from 'rxjs/operators';

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs.component.html',
  styleUrls: ['./blogs.component.css']
})

export class BlogsComponent implements OnInit, OnDestroy {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  isLoading = true;
  searchTerm: string = '';
  private searchTerms = new Subject<string>();
  isSearching = false;
  
  // Pagination variables
  currentPage: number = 0;
  pageSize: number = 3;
  totalPages: number = 0;
  totalArticles: number = 0;

  private routerSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Check for page parameter in URL
    this.route.queryParams.subscribe(params => {
      const page = params['page'];
      if (page && !isNaN(Number(page))) {
        this.currentPage = Number(page) - 1; // Convert to 0-based index
      } else {
        this.currentPage = 0;
      }
      
      // Check for search parameter in URL
      const search = params['search'];
      if (search) {
        this.searchTerm = search;
        this.search(search);
      } else {
        this.loadArticles();
      }
    });

    // Subscribe to router events to reload articles when returning to this page
    // This ensures we always show the latest view counts
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      filter(() => {
        // Check if we're at the main blogs page (not a detail page)
        const isMainBlogsPage = this.router.url.includes('/blogs') && 
                               !this.router.url.includes('/blogs/form-data') && 
                               !/\/blogs\/\d+/.test(this.router.url);
        
        console.log('Navigation ended, current URL:', this.router.url, 'Is main blogs page:', isMainBlogsPage);
        return isMainBlogsPage;
      })
    ).subscribe(() => {
      console.log('Returned to blogs page, forcing complete refresh of articles');
      this.forceCompleteRefresh();
    });

    // Set up search with debounce
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isSearching = true;
        return this.articleService.searchArticlesByTitle(term);
      })
    ).subscribe({
      next: (results) => {
        this.filteredArticles = results;
        this.totalArticles = results.length;
        this.totalPages = Math.ceil(this.totalArticles / this.pageSize);
        this.updateDisplayedArticles();
        this.isSearching = false;
        
        // Immediately display all search results
        if (this.searchTerm) {
          this.articles = this.filteredArticles;
        }
        
        // Force change detection
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error searching articles:', err);
        this.isSearching = false;
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // Search method
  search(term: string): void {
    this.searchTerms.next(term);
    
    // Update URL with search parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: term },
      queryParamsHandling: 'merge'
    });
    
    // If the term is empty, load all articles
    if (!term.trim()) {
      this.loadArticles();
    }
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.search('');
    
    // Remove search parameter from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge'
    });
  }

  loadArticles(): void {
    this.isLoading = true;
    
    console.log(`Loading articles for page ${this.currentPage}, size ${this.pageSize}`);
    
    this.articleService.getPaginatedArticles(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        console.log('Pagination API response:', response);
        
        // Handle both paginated and non-paginated responses
        if (response && response.content) {
          // Paginated response (Spring Data format)
          this.articles = response.content;
          this.filteredArticles = this.articles;
          this.totalArticles = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          console.log(`Pagination working: Showing page ${this.currentPage + 1} of ${this.totalPages} (${this.articles.length} of ${this.totalArticles} total articles)`);
          
          // Log view counts to verify they're up to date
          this.articles.forEach(article => {
            console.log(`Article ID ${article.id}: ${article.viewCount} views`);
          });
        } else if (Array.isArray(response)) {
          // Non-paginated response (array of articles) - should not happen with our modified service
          this.articles = response;
          this.filteredArticles = this.articles;
          this.totalArticles = response.length;
          this.totalPages = Math.ceil(response.length / this.pageSize);
          console.log('Got non-paginated array response - this should not happen with the updated service');
        } else {
          console.error('Unexpected response format:', response);
          this.articles = [];
          this.filteredArticles = [];
          this.totalArticles = 0;
          this.totalPages = 0;
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching articles:', err);
        this.isLoading = false;
        this.articles = [];
        this.filteredArticles = [];
        this.totalArticles = 0;
        this.totalPages = 0;
      }
    });
  }

  // Update displayed articles based on current page and search
  updateDisplayedArticles(): void {
    if (this.filteredArticles.length === 0) {
      this.articles = [];
      return;
    }
    
    if (this.searchTerm) {
      // When searching, we'll display all filtered articles, not just a page
      this.articles = this.filteredArticles;
      this.totalPages = 1; // Only one page when searching
      this.currentPage = 0;
    } else {
      // Standard pagination for non-search state
      const startIndex = this.currentPage * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.articles = this.filteredArticles.slice(startIndex, endIndex);
    }
  }

  navigateToDetail(id: number | undefined): void {
    // Ensure we have a valid ID
    if (id === undefined) {
      console.error('Cannot navigate to article: ID is undefined');
      return;
    }
    
    // Find the article in our list
    const article = this.articles.find(a => a.id === id);
    if (!article) {
      console.warn(`Article with ID ${id} not found in the current list`);
      this.router.navigate(['/blogs', id]);
      return;
    }
    
    // Store original value in case we need to revert
    const originalViewCount = article.viewCount || 0;
    
    // Optimistically update the view count in UI
    article.viewCount = originalViewCount + 1;
    console.log(`Optimistically updated view count for article ${id} from ${originalViewCount} to ${article.viewCount}`);
    
    // Force change detection to update the view immediately
    this.cdr.detectChanges();
    
    // Set a timeout to ensure navigation happens even if the API call hangs
    const navigationTimeout = setTimeout(() => {
      console.log('View count increment timed out, proceeding with navigation');
      this.router.navigate(['/blogs', id]);
    }, 800); // Wait max 800ms before proceeding regardless
    
    // Call the service to increment the view count
    this.articleService.incrementViewCount(id).subscribe({
      next: (response) => {
        console.log('View count incremented:', response);
        
        // Update with the actual count from the response if available
        if (response && response.response) {
          // Update with the viewCount if it exists
          if (response.response.viewCount !== undefined) {
            article.viewCount = response.response.viewCount;
            console.log(`Updated view count from response: ${article.viewCount}`);
            
            // Force change detection to update the view
            this.cdr.detectChanges();
          }
          
          // If the response includes the full article, update any other properties
          if (response.response.article) {
            // Preserve our current view count
            const currentViewCount = article.viewCount;
            // Update other article properties
            Object.assign(article, response.response.article);
            // Make sure we keep the view count we just set
            article.viewCount = currentViewCount;
            console.log('Updated article with latest data from server');
          }
        }
        
        clearTimeout(navigationTimeout); // Clear the timeout since we got a response
        this.router.navigate(['/blogs', id]);
      },
      error: (err) => {
        console.error('Failed to increment view count:', err);
        
        // Log specific error for CORS issues
        if (err.status === 0) {
          console.warn('CORS error detected when incrementing view count. The count may not update properly.');
        }
        
        // Only revert the optimistic update if it's not a CORS error
        // For CORS, we keep the optimistic update for better UX
        if (err.status !== 0) {
          article.viewCount = originalViewCount;
          console.log(`Reverted view count to original: ${originalViewCount}`);
        }
        
        clearTimeout(navigationTimeout); // Clear the timeout since we got a response
        this.router.navigate(['/blogs', id]); // Navigate anyway
      }
    });
  }

  navigateToAddArticle(): void {
    this.router.navigate(['/blogs/form-data']);
  }
  
  isFormRoute(): boolean {
    return this.router.url.includes('/blogs/form-data');
  }
  
  // Pagination methods
  goToPage(page: number): void {
    console.log(`Navigating to page ${page + 1}`);
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      // Use navigation with preserveQueryParams to maintain other query params
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: page + 1 }, // 1-based for URL
        queryParamsHandling: 'merge' // preserve other query params
      });
      
      if (this.searchTerm) {
        // If we're searching, update displayed articles
        this.updateDisplayedArticles();
      } else {
        // Otherwise load from API
        this.loadArticles();
      }
    }
  }

  nextPage(): void {
    console.log('Attempting to navigate to next page');
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    console.log('Attempting to navigate to previous page');
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }
  
  // Generate an array of page numbers for the template
  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    
    // If no pages or only one page, return empty array
    if (this.totalPages <= 1) {
      return pageNumbers;
    }
    
    // Show limited number of pages with current page in the middle
    const totalPageButtons = Math.min(5, this.totalPages);
    let startPage = Math.max(0, this.currentPage - Math.floor(totalPageButtons / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + totalPageButtons - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < totalPageButtons) {
      startPage = Math.max(0, endPage - totalPageButtons + 1);
    }
    
    console.log(`Generating page numbers from ${startPage} to ${endPage}`);
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  }

  // Handle image loading errors
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      // Hide the image
      imgElement.style.display = 'none';
      
      // Add error class to parent
      if (imgElement.parentElement) {
        imgElement.parentElement.classList.add('image-error');
      }
    }
  }

  // Add this method to force a refresh of the articles
  refreshArticles(): void {
    console.log('Forcing refresh of articles with latest view counts');
    
    // Clear any existing articles
    this.articles = [];
    this.filteredArticles = [];
    this.isLoading = true;
    
    // Add a timestamp to bypass cache
    const timestamp = new Date().getTime();
    
    // Get fresh data from server
    this.articleService.getPaginatedArticles(this.currentPage, this.pageSize).pipe(
      tap(response => {
        console.log(`Refreshed articles at ${timestamp}:`, response);
      })
    ).subscribe({
      next: (response) => {
        if (response && response.content) {
          this.articles = response.content;
          this.filteredArticles = this.articles;
          this.totalArticles = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          
          // Log view counts for debugging
          this.articles.forEach(article => {
            console.log(`Article ${article.id}: ${article.viewCount} views`);
          });
          
          // Force change detection to update the UI
          this.cdr.detectChanges();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error refreshing articles:', err);
        this.isLoading = false;
      }
    });
  }

  // New method to force a complete refresh bypassing all caches
  forceCompleteRefresh(): void {
    console.log('Performing complete refresh with cache bypass');
    
    // Clear any existing articles immediately
    this.articles = [];
    this.filteredArticles = [];
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // Get all articles with fresh data
    this.articleService.getArticles().pipe(
      tap(allArticles => {
        console.log('Got fresh data for ALL articles, view counts:');
        allArticles.forEach(a => console.log(`Article ${a.id}: ${a.viewCount} views`));
      })
    ).subscribe({
      next: (allArticles) => {
        // Get current page of articles
        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.filteredArticles = allArticles;
        this.articles = allArticles.slice(startIndex, endIndex);
        this.totalArticles = allArticles.length;
        this.totalPages = Math.ceil(this.totalArticles / this.pageSize);
        
        console.log(`Displaying ${this.articles.length} articles (page ${this.currentPage + 1} of ${this.totalPages})`);
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error in complete refresh:', err);
        this.isLoading = false;
        // Fallback to normal refresh
        this.refreshArticles();
      }
    });
  }
}
