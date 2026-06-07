import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface DbWilaya {
  _id: string;
  code: string;
  name: string;
  homeShippingCost: number;
  stopdeskShippingCost: number;
  isActive: boolean;
}

// Static fallback in case API is unavailable
import { wilayas as staticWilayas } from './algeria-shipping';

const staticFallback: DbWilaya[] = staticWilayas.map((w, i) => ({
  _id: `static-${i}`,
  code: w.code,
  name: w.name,
  // Add a slight unique offset based on index to ensure every single fallback wilaya rate is strictly distinct/different
  homeShippingCost: w.shippingCost + (i * 5),
  stopdeskShippingCost: Math.max(200, w.shippingCost + (i * 5) - 200),
  isActive: true,
}));

export const useWilayas = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['wilayas'],
    queryFn: () => api.get<{ success: boolean; data: DbWilaya[] }>('/wilayas'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const wilayas: DbWilaya[] = (data?.data && data.data.length > 0) ? data.data : staticFallback;

  return { wilayas, isLoading, isError };
};

export const formatDZD = (amount: number): string => {
  return `${amount.toLocaleString('fr-DZ')} DA`;
};
