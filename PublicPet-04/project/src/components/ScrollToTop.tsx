import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Whenever the pathname changes, instantly snap to the top-left corner
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // This component renders nothing to the screen
};