import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { saveCurrentRoute, getSavedRoute, isValidRoute } from '@/utils/routePersistence';

export const useRoutePersistence = () => {
  const [location, setLocation] = useLocation();

  // Save current route whenever it changes
  useEffect(() => {
    if (isValidRoute(location)) {
      saveCurrentRoute(location);
    }
  }, [location]);

  // Restore saved route on initial load
  const restoreSavedRoute = () => {
    const savedRoute = getSavedRoute();
    if (savedRoute && isValidRoute(savedRoute) && savedRoute !== location) {
      console.log('🔄 Restoring saved route:', savedRoute);
      setLocation(savedRoute);
      return true;
    }
    return false;
  };

  return {
    location,
    setLocation,
    restoreSavedRoute
  };
};
