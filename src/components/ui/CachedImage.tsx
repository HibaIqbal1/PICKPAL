import React, { useState, useEffect } from "react";

const imageCache = new Set<string>();

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80";

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

export const CachedImage = React.memo<CachedImageProps>(function CachedImage({
  src,
  alt,
  className,
  fallbackSrc = DEFAULT_FALLBACK,
  loading = "lazy",
  ...props
}) {
  const effectiveSrc = src && src.trim().length > 0 ? src : fallbackSrc;
  const isPreloaded = imageCache.has(effectiveSrc);
  const [currentSrc, setCurrentSrc] = useState<string>(effectiveSrc);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setCurrentSrc(effectiveSrc);
    setHasError(false);
  }, [effectiveSrc]);

  const handleError = () => {
    if (!hasError && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    if (currentSrc) {
      imageCache.add(currentSrc);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      className={className}
      {...props}
    />
  );
});
