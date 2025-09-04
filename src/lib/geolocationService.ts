// Simple IP-based geolocation service
// In production, you might want to use a more robust service like MaxMind or IP2Location

export interface LocationData {
  country: string;
  countryCode: string;
}

export const getUserLocation = async (): Promise<LocationData | null> => {
  try {
    // Using a free IP geolocation service
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.reason || 'Location service error');
    }

    return {
      country: data.country_name,
      countryCode: data.country_code,
    };
  } catch (error) {
    console.warn('Failed to detect user location:', error);
    return null;
  }
};

// Fallback using browser's built-in geolocation API
export const getBrowserLocation = (): Promise<GeolocationPosition | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        console.warn('Geolocation error:', error);
        resolve(null);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};