export interface Helmet {
  id: number;
  name: string;
  brand: string;
  category: string;
  star_rating: number;
  safety_score: number;
  vt_test_price: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  listing_count: number;
  available_count: number;
  image_url?: string | null;
  amazon_url?: string | null;
}

export type SortOption = 'rating' | 'safety' | 'price';
export type CategoryFilter = '' | 'Road' | 'All Mountain' | 'Urban' | 'Multi-sport' | 'Full-Face';
export type BrandFilter = '' | string;