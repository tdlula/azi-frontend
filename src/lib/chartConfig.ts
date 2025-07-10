/**
 * Enhanced Chart Color System
 * 
 * This module provides sophisticated color generation for data visualizations,
 * implementing a value-based color spectrum that helps users instantly understand
 * data relationships through intuitive color coding.
 * 
 * Color Mapping:
 * - Blue (HSL 220-320): Low values (0-20%)
 * - Green (HSL 120-175): Low-medium values (20-40%)
 * - Yellow (HSL 55-80): Medium values (40-60%)
 * - Orange (HSL 25-60): High-medium values (60-80%)
 * - Red (HSL 0-15): High values (80-100%)
 * 
 * Features:
 * - Value-based color assignment
 * - Gradient generation for enhanced visual appeal
 * - Professional HSL color space utilization
 * - Accessibility-conscious color selection
 * 
 * @author AZI Analytics Platform
 * @version 2.0
 * @date June 29, 2025
 */

export interface ChartColors {
  primary: string;
  secondary: string;
  palette: string[];
}

export function getChartColors(scheme?: string): ChartColors {
  const colorSchemes: Record<string, ChartColors> = {
    blue: {
      primary: "#2563eb", // Blue
      secondary: "#3b82f6", // Light Blue
      palette: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe", "#1d4ed8", "#1e40af", "#1e3a8a"],
    },
    green: {
      primary: "#059669", // Emerald
      secondary: "#10b981", // Green
      palette: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#047857", "#065f46", "#064e3b"],
    },
    purple: {
      primary: "#7c3aed", // Violet
      secondary: "#8b5cf6", // Purple
      palette: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#6d28d9", "#5b21b6", "#4c1d95"],
    },
    orange: {
      primary: "#ea580c", // Orange
      secondary: "#f97316", // Orange
      palette: ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#c2410c", "#9a3412", "#7c2d12"],
    },
    rainbow: {
      primary: "#FF6B6B", // Coral Red
      secondary: "#4ECDC4", // Teal
      palette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"],
    },
  };

  return colorSchemes[scheme || "rainbow"] || colorSchemes.rainbow;
}

// Generate dynamic colors based on data values
export function generateValueBasedColors(values: number[]): string[] {
  if (!values || values.length === 0) return ["#3b82f6"];
  
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  return values.map((value) => {
    const normalized = (value - min) / (max - min || 1);
    
    // Color spectrum from cool (blue) to hot (red)
    if (normalized >= 0.8) {
      // Hot - Red spectrum
      const intensity = (normalized - 0.8) / 0.2;
      return `hsl(${0 + intensity * 15}, ${80 + intensity * 20}%, ${45 + intensity * 15}%)`;
    } else if (normalized >= 0.6) {
      // Warm - Orange to Red
      const intensity = (normalized - 0.6) / 0.2;
      return `hsl(${25 + intensity * 35}, ${75 + intensity * 20}%, ${50 + intensity * 10}%)`;
    } else if (normalized >= 0.4) {
      // Medium - Yellow to Orange
      const intensity = (normalized - 0.4) / 0.2;
      return `hsl(${55 + intensity * 25}, ${70 + intensity * 20}%, ${55 + intensity * 10}%)`;
    } else if (normalized >= 0.2) {
      // Cool-Medium - Green to Yellow
      const intensity = (normalized - 0.2) / 0.2;
      return `hsl(${120 + intensity * 55}, ${65 + intensity * 15}%, ${45 + intensity * 20}%)`;
    } else {
      // Cool - Blue to Green
      const intensity = normalized / 0.2;
      return `hsl(${220 + intensity * 100}, ${70 + intensity * 10}%, ${40 + intensity * 25}%)`;
    }
  });
}

// Generate gradient colors for enhanced visual appeal
export function generateGradientColors(values: number[]): { colors: string[], gradients: string[] } {
  const baseColors = generateValueBasedColors(values);
  
  const gradients = baseColors.map((color, index) => {
    // Extract HSL values and create gradient variations
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const [, h, s, l] = match;
      const lightVariant = `hsl(${h}, ${Math.max(20, parseInt(s) - 20)}%, ${Math.min(80, parseInt(l) + 20)}%)`;
      return `linear-gradient(135deg, ${color} 0%, ${lightVariant} 100%)`;
    }
    return `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`;
  });
  
  return { colors: baseColors, gradients };
}

export const defaultChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  animationDuration: 800,
  tooltipStyle: {
    backgroundColor: "#003366", // Midnight Blue
    border: "1px solid #00FFFF", // Cyan border
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
    color: "#A3D8FF", // Sky Blue text
  },
};
