import { useState, useEffect } from 'react';
import { AmazonProduct } from '@/utils/amazonProductAPI';

interface UseAmazonProductOptions {
  asin?: string;
  brand?: string;
  model?: string;
  search?: string;
  enabled?: boolean;
}

interface UseAmazonProductResult {
  product: AmazonProduct | null;
  alternatives: AmazonProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAmazonProduct({
  asin,
  brand,
  model,
  search,
  enabled = true
}: UseAmazonProductOptions): UseAmazonProductResult {
  const [product, setProduct] = useState<AmazonProduct | null>(null);
  const [alternatives, setAlternatives] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!enabled || (!asin && !brand && !model && !search)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (asin) params.append('asin', asin);
      if (brand) params.append('brand', brand);
      if (model) params.append('model', model);
      if (search) params.append('search', search);

      const response = await fetch(`/api/helmet-price?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product data');
      }

      if (data.success && data.product) {
        setProduct(data.product);
        setAlternatives(data.alternatives || []);
      } else {
        setError('No product found');
      }
    } catch (err) {
      console.error('Error fetching Amazon product:', err);
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asin, brand, model, search, enabled]);

  return {
    product,
    alternatives,
    loading,
    error,
    refetch: fetchProduct
  };
}