// Centralized API base URL configuration

/*export const API_BASE_URL: string =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PROD_API_BASE_URL
    : import.meta.env.VITE_DEV_API_BASE_URL || "http://localhost:5000";*/

    export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";