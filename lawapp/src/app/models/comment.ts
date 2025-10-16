export interface Comment {
  id?: number;
  _id?: number | string;
  commentId?: number;
  content: string;
  postedBy: string;
  createdAt?: Date;
  article?: { 
    id?: number;
    name: string;
    content: string;
    postedBy: string;
    tags: string[];
    img: string | null;
    likeCount?: number;
    viewCount?: number;
    date?: Date;
    commentId?: number;
   }; // Simplified post reference
  post?: {
    id?: number;
    name?: string;
    content?: string;
    postedBy?: string;
   }; // Added post property that's actually coming from the API
}