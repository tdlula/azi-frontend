// Route persistence utility for remembering the current page on refresh
export const ROUTE_STORAGE_KEY = 'azi_current_route';

export const saveCurrentRoute = (route: string) => {
  try {
    localStorage.setItem(ROUTE_STORAGE_KEY, route);
    console.log('💾 Saved current route to localStorage:', route);
  } catch (error) {
    console.warn('Failed to save current route:', error);
  }
};

export const getSavedRoute = (): string | null => {
  try {
    const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
    console.log('🔄 Retrieved saved route from localStorage:', savedRoute);
    return savedRoute;
  } catch (error) {
    console.warn('Failed to get saved route:', error);
    return null;
  }
};

export const clearSavedRoute = () => {
  try {
    localStorage.removeItem(ROUTE_STORAGE_KEY);
    console.log('🗑️ Cleared saved route from localStorage');
  } catch (error) {
    console.warn('Failed to clear saved route:', error);
  }
};

// Valid routes that can be persisted
export const VALID_ROUTES = [
  '/',
  '/dashboard',
  '/dashboard-minimal', 
  '/chat',
  '/settings'
];

export const isValidRoute = (route: string): boolean => {
  return VALID_ROUTES.includes(route);
};
