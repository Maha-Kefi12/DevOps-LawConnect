export interface Article {
    id?: number;
    name: string;
    content: string;
    postedBy: string;
    tags: string[];
    img: string | null;
    likeCount?: number;
    viewCount?: number;
    date?: Date;
    comments?: Comment[];

  }
  export interface ArticleStatistic {
    name: string;
    viewCount: number;
  }
  
  
  