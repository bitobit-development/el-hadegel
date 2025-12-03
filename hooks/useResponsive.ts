'use client';

import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      setDimensions({
        width,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return dimensions;
};
