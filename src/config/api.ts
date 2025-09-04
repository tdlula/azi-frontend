// Centralized API base URL configuration

export const API_BASE_URL: string =
  import.meta.env.VITE_ENV_MODE === "production"
    ? import.meta.env.VITE_PROD_API_BASE_URL
    : import.meta.env.VITE__API_BASE_URL || "http://129.151.191.161:5000";

    //export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://129.151.191.161:5000";