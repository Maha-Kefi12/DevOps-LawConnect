import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ArticleService } from 'src/app/services/article.service';
import { firstValueFrom } from 'rxjs'; // Correct import
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Article } from 'src/app/models/article';

@Component({
  selector: 'app-form-data',
  templateUrl: './form-data.component.html',
  styleUrls: ['./form-data.component.css']
})
export class FormDataComponent {
  articleForm!: FormGroup;
  tags: string[] = [];
  isLoading = false;
  articleId: number | null = null; // Store the article ID here
  previewImageUrl: string | ArrayBuffer | null = null;
  selectedImageFile: File | null = null;
  base64Image: string = ''; // This will store the image to send to backend
  submitted: boolean = false;
  isPhotoError = false;
  uploadError: string = '';
  tagInput: string = '';



  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute, // ActivatedRoute for route params
    private snackBar: MatSnackBar,
    private articleService: ArticleService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    // Get the article ID from query params
    this.route.queryParams.subscribe(params => {
      this.articleId = +params['id']; // Retrieve the article ID from the URL query parameter
      if (this.articleId) {
        this.loadArticle(this.articleId); // If there's an ID, load the article to edit
      }
    });
  }
  
  initializeForm(): void {
    this.articleForm = this.fb.group({
      name: ['', Validators.required],
      content: ['', [Validators.required, Validators.maxLength(50000)]],
      postedBy: ['', Validators.required]
    });
  }

  // Update the method to handle either Event or KeyboardEvent

  
  
  
  addTag(tag: string): void {
    const trimmedTag = tag.trim();
    if (trimmedTag && !this.tags.includes(trimmedTag)) {
      this.tags.push(trimmedTag);
    }
  }  
  
  
  
  
  

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  navigateToArticleList(): void {
    this.router.navigate(['/article-list']);
  }

  async loadArticle(id: number): Promise<void> {
    try {
      const article = await firstValueFrom(this.articleService.getArticleById(id));
      this.articleForm.patchValue({
        name: article.name,
        content: article.content,
        postedBy: article.postedBy
      });
      
      if (article.tags) {
        this.tags = article.tags;
      }
    } catch (error) {
      console.error('Error loading article:', error);
      this.showError('Failed to load article for editing.');
    }
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    
    if (!this.articleForm.valid) {
      return;
    }
  
    // Show loading indicator
    this.isLoading = true;
  
    // Prepare the post object matching backend expectations
    const post: Article = {
      name: this.articleForm.get('name')?.value,
      content: this.articleForm.get('content')?.value,
      postedBy: this.articleForm.get('postedBy')?.value,
      tags: this.tags,
      img: this.base64Image || null,
      // These should probably be omitted for updates
      ...(!this.articleId && {
        likeCount: 0,
        viewCount: 0,
        date: new Date()
      })
    };
  
    console.log('Sending post:', post);
  
    try {
      let response;
      if (this.articleId) {
        // Update existing article
        response = await firstValueFrom(
          this.http.put<Article>(`http://localhost:8080/api/posts/updatePost/${this.articleId}`, post, {
            headers: new HttpHeaders({ 
              'Content-Type': 'application/json'
            }),
            observe: 'response'
          })
        );
      } else {
        // Create new article
        response = await firstValueFrom(
          this.http.post('http://localhost:8080/api/posts/createPost', post, {
            headers: new HttpHeaders({ 
              'Content-Type': 'application/json'
            }),
            observe: 'response',
            responseType: 'text'  // Expect a text response
          })
        );
      }
  
      // Hide loading indicator
      this.isLoading = false;
   
      if (response.status === 200 || response.status === 201) {
        const message = this.articleId ? 'Article updated successfully!' : 'Article created successfully!';
        this.showSuccess(message);
        
        console.log('Navigating to /blogs'); // Added console.log
        this.router.navigate(['/blogs']);
      } else {
        this.showError(`Unexpected response: ${response.status}`);
      }
    } catch (error: any) {
      // Hide loading indicator
      this.isLoading = false;
      
      console.error('Error:', error);
      let errorMessage = this.articleId ? 'Failed to update article' : 'Failed to create article';
      if (error.error) {
        errorMessage += `: ${JSON.stringify(error.error)}`;
      }
      this.showError(errorMessage);
    }
  }
  
  

  private showSuccess(message: string): void {
    console.log('Success:', message);
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showError(message: string): void {
    console.error('Error:', message);
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Set preview image (full data URL)
        this.previewImageUrl = e.target.result;
        
        // Extract just the base64 part (remove "data:image/...;base64," prefix)
        const base64String = e.target.result.split(',')[1];
        this.base64Image = base64String;
      };
      reader.readAsDataURL(file);
    }
  }
  

  async updateArticleWithFormData(): Promise<void> {
    if (!this.articleId || this.articleForm.invalid) {
      this.showError('Form is invalid or article ID is missing.');
      return;
    }
  
    const articleData = {
      name: this.articleForm.get('name')?.value,
      content: this.articleForm.get('content')?.value,
      postedBy: this.articleForm.get('postedBy')?.value,
      tags: this.tags,
      date: new Date().toISOString(),
      image: this.base64Image ? this.base64Image : null // Include base64 image if selected
    };
  
    try {
      const updated = await firstValueFrom(
        this.articleService.updateArticleWithJson(this.articleId, articleData)
      );
      console.log('Updated article with JSON:', updated);
      this.showSuccess('Article updated with JSON!');
      this.router.navigate(['/article-list']);
    } catch (error) {
      console.error('JSON update error:', error);
      this.showError('Failed to update article with JSON.');
    }
  }
}
