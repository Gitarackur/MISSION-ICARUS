import { useEffect, useState } from 'react'

const useStickyBottomScroll = () => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const scrolledToBottom = scrollTop + windowHeight >= documentHeight - 50;

      setIsSticky(scrolledToBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  return {
    isSticky
  }
}

export default useStickyBottomScroll