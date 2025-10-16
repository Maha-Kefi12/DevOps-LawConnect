import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PerspectiveService {
  // Replace this with your actual Perspective API key
  private readonly API_KEY = 'YOUR_PERSPECTIVE_API_KEY';
  private readonly API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

  constructor(private http: HttpClient) { }

  /**
   * Analyzes text for toxicity using Google's Perspective API
   * @param text The text to analyze
   * @returns Observable with toxicity score or error
   */
  analyzeToxicity(text: string): Observable<{ isToxic: boolean, score: number }> {
    // Don't make API call for empty text
    if (!text || text.trim() === '') {
      return of({ isToxic: false, score: 0 });
    }

    const url = `${this.API_URL}?key=${this.API_KEY}`;
    
    const requestBody = {
      comment: { text: text },
      languages: ['en'],
      requestedAttributes: {
        TOXICITY: {},
        SEVERE_TOXICITY: {},
        IDENTITY_ATTACK: {},
        INSULT: {},
        PROFANITY: {},
        THREAT: {}
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(url, requestBody, { headers }).pipe(
      map((response: any) => {
        // Extract toxicity scores
        const toxicityScore = response.attributeScores.TOXICITY.summaryScore.value;
        const severeToxicityScore = response.attributeScores.SEVERE_TOXICITY.summaryScore.value;
        const identityAttackScore = response.attributeScores.IDENTITY_ATTACK.summaryScore.value;
        const insultScore = response.attributeScores.INSULT.summaryScore.value;
        const profanityScore = response.attributeScores.PROFANITY.summaryScore.value;
        const threatScore = response.attributeScores.THREAT.summaryScore.value;
        
        // Take the maximum score
        const maxScore = Math.max(
          toxicityScore, 
          severeToxicityScore, 
          identityAttackScore, 
          insultScore,
          profanityScore,
          threatScore
        );
        
        // Consider a comment toxic if any score is above 0.7
        const isToxic = maxScore > 0.7;
        
        return { isToxic, score: maxScore };
      }),
      catchError(error => {
        console.error('Error analyzing toxicity:', error);
        // Return a safe default on error - let the comment through
        // but log the error
        return of({ isToxic: false, score: 0 });
      })
    );
  }

  /**
   * Mock method for testing without API key
   * This simulates the Perspective API for development
   */
  analyzeTextMock(text: string): Observable<{ isToxic: boolean, score: number }> {
    if (!text || text.trim() === '') {
      return of({ isToxic: false, score: 0 });
    }

    // These are words that would typically trigger the toxicity filter
    const toxicWords = [
      'stupid', 'idiot', 'hate', 'awful', 'terrible', 'kill', 'die', 'dumb', 
      'fuck', 'shit', 'bitch', 'ass', 'asshole', 'bastard', 'cunt', 'damn', 
      'dick', 'whore', 'piss', 'retard', 'slut', 'suck', 'crap', 
      'racist', 'nigger', 'faggot', 'gay', 'nazi', 'jew'
    ];
    
    // Check if the comment contains any toxic words
    const lowerText = text.toLowerCase();
    const containsToxicWord = toxicWords.some(word => {
      // Use word boundary check to prevent false positives (e.g. "class" containing "ass")
      const regex = new RegExp(`\\b${word}\\b|${word}[^\\w]|[^\\w]${word}\\b`, 'i');
      return regex.test(lowerText);
    });
    
    // Simulate API response delay
    return new Observable(observer => {
      setTimeout(() => {
        if (containsToxicWord) {
          observer.next({ isToxic: true, score: 0.85 });
        } else {
          observer.next({ isToxic: false, score: 0.2 });
        }
        observer.complete();
      }, 500);
    });
  }
} 