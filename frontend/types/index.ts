export interface Video {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  hls_path: string;
  poster_path: string | null;
  duration: number | null;
  file_size: number | null;
  is_processed: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: 'viewer' | 'admin';
  created_at: string;
}

export interface CatalogResponse {
  videos: Video[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface VideoProcessingStatus {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}
