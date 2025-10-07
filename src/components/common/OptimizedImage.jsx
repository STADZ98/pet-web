import React, { useState, useEffect } from "react";

const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  loading = "lazy",
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Update image source if prop changes
    setImageSrc(src);
  }, [src]);

  const handleError = () => {
    setImageSrc("/no-image.png"); // Fallback to default image
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className || ""}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className || ""} ${
          isLoading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-300`}
        width={width}
        height={height}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
};

export default OptimizedImage;
