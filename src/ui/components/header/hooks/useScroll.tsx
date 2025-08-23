import { useState, useRef, useEffect } from "react";

export const useScroll = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Check the current property of the ref here
      if (placeholderRef.current) {
        const topPosition = placeholderRef.current.getBoundingClientRect().top;
        const shouldBeScrolled = topPosition <= 0;
        
        if (shouldBeScrolled !== isScrolled) {
          setIsScrolled(shouldBeScrolled);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled]); // Keep isScrolled in the dependency array

  return {
    placeholderRef, // Return the ref directly
    isScrolled
  };
};