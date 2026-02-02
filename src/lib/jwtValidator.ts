interface DecodedToken {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export const decodeJWT = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return false;
  }

  const expiryDate = new Date(decoded.exp * 1000);
  const currentTime = Date.now();

  return expiryDate.getTime() <= currentTime;
};

export const isTokenExpiringWithin2Mins = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return false;
  }

  const expiryDate = new Date(decoded.exp * 1000);
  const twoMinutesFromNow = Date.now() + 2 * 60 * 1000;

  return expiryDate.getTime() <= twoMinutesFromNow;
};
