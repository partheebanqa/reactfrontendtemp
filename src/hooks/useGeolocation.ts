import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBrowserLocation, getUserLocation, LocationData } from '@/lib/geolocationService';

export const useGeolocation = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const {
    data: locationData,
    isLoading,
    error,
    isSuccess
  } = useQuery<LocationData | null>({
    queryKey: ['userLocation'],
    queryFn: getUserLocation,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    // Check if geolocation is supported
    if ('geolocation' in navigator) {
      setHasPermission(true);
    } else {
      setHasPermission(false);
    }
  }, []);

  return {
    locationData,
    isLoading,
    error,
    isSuccess,
    hasPermission,
  };
};