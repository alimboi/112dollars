/**
 * Color Theme Utility
 * Handles theme-aware color management to prevent invisible text
 * when users switch between light and dark themes
 */

export interface ColorMapping {
  cssVariable: string;
  lightMode: string;
  darkMode: string;
  label: string;
}

export class ColorThemeUtil {
  /**
   * Predefined color palette that switches based on theme
   * Admins select semantic colors instead of raw colors
   */
  static readonly SEMANTIC_COLORS: Record<string, ColorMapping> = {
    'text-primary': {
      cssVariable: '--text-primary',
      lightMode: '#1f2937',
      darkMode: '#f3f4f6',
      label: 'Primary Text'
    },
    'text-secondary': {
      cssVariable: '--text-secondary',
      lightMode: '#6b7280',
      darkMode: '#d1d5db',
      label: 'Secondary Text'
    },
    'text-accent': {
      cssVariable: '--accent-primary',
      lightMode: '#f97316',
      darkMode: '#fb923c',
      label: 'Accent Text'
    },
    'text-success': {
      cssVariable: '--success-primary',
      lightMode: '#16a34a',
      darkMode: '#22c55e',
      label: 'Success Text'
    },
    'text-error': {
      cssVariable: '--error-primary',
      lightMode: '#dc2626',
      darkMode: '#ef4444',
      label: 'Error Text'
    },
    'bg-light': {
      cssVariable: '--bg-primary',
      lightMode: '#ffffff',
      darkMode: '#1e293b',
      label: 'Light Background'
    },
    'bg-secondary': {
      cssVariable: '--bg-secondary',
      lightMode: '#f9fafb',
      darkMode: '#0f172a',
      label: 'Secondary Background'
    },
    'bg-accent': {
      cssVariable: '--accent-100',
      lightMode: '#fed7aa',
      darkMode: '#7c2d12',
      label: 'Accent Background'
    }
  };

  /**
   * Get the appropriate color for the current theme
   * @param color Raw color value or semantic color name
   * @param theme Current theme ('light' or 'dark')
   * @returns The color appropriate for the theme
   */
  static getThemeAwareColor(color: string | undefined, theme: 'light' | 'dark'): string {
    if (!color) return '';

    // Check if it's a semantic color reference
    const semantic = this.SEMANTIC_COLORS[color.toLowerCase()];
    if (semantic) {
      return `var(${semantic.cssVariable})`;
    }

    // If it's a raw hex/rgb color, check contrast and adjust if needed
    return this.adjustColorForTheme(color, theme);
  }

  /**
   * Check if a color is "light" (suitable for dark backgrounds)
   * Uses relative luminance calculation
   */
  static isLightColor(color: string): boolean {
    const rgb = this.hexToRgb(color);
    if (!rgb) return false;

    // Calculate relative luminance (WCAG formula)
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5;
  }

  /**
   * Automatically adjust a color if it would have poor contrast with the theme
   */
  static adjustColorForTheme(color: string, theme: 'light' | 'dark'): string {
    const isLight = this.isLightColor(color);

    // If theme is light and color is light -> make it dark
    if (theme === 'light' && isLight) {
      return this.darkenColor(color, 0.7);
    }

    // If theme is dark and color is dark -> make it light
    if (theme === 'dark' && !isLight) {
      return this.lightenColor(color, 0.7);
    }

    return color;
  }

  /**
   * Calculate contrast ratio between two colors (WCAG)
   */
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
   */
  static isAccessibleContrast(textColor: string, backgroundColor: string): boolean {
    return this.getContrastRatio(textColor, backgroundColor) >= 4.5;
  }

  /**
   * Get warning if colors have poor contrast
   */
  static getContrastWarning(
    textColor: string,
    backgroundColor: string
  ): { hasWarning: boolean; message: string; ratio: number } {
    const ratio = this.getContrastRatio(textColor, backgroundColor);
    const accessible = ratio >= 4.5;

    return {
      hasWarning: !accessible,
      message: accessible
        ? `Good contrast ratio (${ratio.toFixed(1)}:1) ✓`
        : `Poor contrast ratio (${ratio.toFixed(1)}:1). Recommended: 4.5:1 or higher for accessibility.`,
      ratio
    };
  }

  /**
   * Convert hex to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  /**
   * Get relative luminance (WCAG formula)
   */
  private static getRelativeLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Darken a color by a factor
   */
  private static darkenColor(color: string, factor: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    return this.rgbToHex(
      Math.round(rgb.r * factor),
      Math.round(rgb.g * factor),
      Math.round(rgb.b * factor)
    );
  }

  /**
   * Lighten a color by a factor
   */
  private static lightenColor(color: string, factor: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    return this.rgbToHex(
      Math.round(rgb.r + (255 - rgb.r) * (1 - factor)),
      Math.round(rgb.g + (255 - rgb.g) * (1 - factor)),
      Math.round(rgb.b + (255 - rgb.b) * (1 - factor))
    );
  }

  /**
   * Convert RGB to hex
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get all semantic color options for admin dropdown
   */
  static getColorOptions(): Array<{ value: string; label: string }> {
    return Object.entries(this.SEMANTIC_COLORS).map(([value, mapping]) => ({
      value,
      label: mapping.label
    }));
  }
}
