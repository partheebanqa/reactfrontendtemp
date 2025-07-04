// Example of validating image URLs
import { isImageUrlCompliant } from '@/security/cspUtils';
import { useState, useEffect } from 'react';

interface SecureImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

export function SecureImage({ src, alt, fallbackSrc = '/placeholder.jpg' }: SecureImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  
  useEffect(() => {
    if (isImageUrlCompliant(src)) {
      setImageSrc(src);
    } else {
      console.warn(`Image URL not compliant with CSP: ${src}`);
      setImageSrc(fallbackSrc);
    }
  }, [src, fallbackSrc]);
  
  return <img src={imageSrc} alt={alt} />;
}
