/**
 * FRANKENSTEIN LAB - BACKGROUND ROTATOR
 * Extracted from frankenstein-ui.js (Refactoring v2.9.200 Phase 1)
 *
 * Handles: Background image rotation, Da Vinci artwork cycling
 * Original location: frankenstein-ui.js lines 974-1036
 *
 * @version 1.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

// Lista de backgrounds disponibles (vintage scientific/technical images)
const DEFAULT_BACKGROUNDS = [
  'assets/backgrounds/vitruvio.jpg',
  'assets/backgrounds/leonardo-skull.jpg',
  'assets/backgrounds/frankenstein-1931.jpg',
  'assets/backgrounds/turtle-anatomy.jpg',
  'assets/backgrounds/cheselden-skeleton.jpg',
  'assets/backgrounds/galvanism-aldini.jpg',
  'assets/backgrounds/spiralist-anatomy.jpg',
  'assets/backgrounds/spiralist-bones.jpg',
  'assets/backgrounds/spiralist-heart.jpg'
];

export class BackgroundRotator {
  /**
   * @param {string} cssVariableName - CSS variable to update (e.g., '--da-vinci-bg')
   * @param {string[]} backgroundImages - Array of background image paths
   */
  constructor(cssVariableName = '--da-vinci-bg', backgroundImages = DEFAULT_BACKGROUNDS) {
    this.cssVariableName = cssVariableName;
    this.backgrounds = backgroundImages.length > 0 ? backgroundImages : DEFAULT_BACKGROUNDS;
    this.currentIndex = -1;
    this.intervalId = null;
  }

  /**
   * Set random vintage scientific/technical background image
   * Extracted from frankenstein-ui.js line 974
   *
   * @param {string|null} preferredImage - Optional specific image to use
   */
  setRandomBackground(preferredImage = null) {
    const fallbackImage = 'assets/backgrounds/vitruvio.jpg';
    const available = this.backgrounds?.length ? this.backgrounds : [fallbackImage];

    let selectedImage = preferredImage;
    if (!selectedImage) {
      if (available.length === 1) {
        selectedImage = available[0];
      } else {
        let nextIndex = this.currentIndex;
        let safety = 0;
        while (nextIndex === this.currentIndex && safety < 10) {
          nextIndex = Math.floor(Math.random() * available.length);
          safety += 1;
        }
        this.currentIndex = nextIndex;
        selectedImage = available[nextIndex];
      }
    }

    const resolvedUrl = this.resolveAssetUrl(selectedImage);
    const fallbackUrl = this.resolveAssetUrl(fallbackImage);

    const applyBackground = (url) => {
      document.documentElement.style.setProperty(this.cssVariableName, `url('${url}')`);
    };

    const preview = new Image();
    preview.onload = () => applyBackground(resolvedUrl);
    preview.onerror = () => applyBackground(fallbackUrl || resolvedUrl);
    preview.src = resolvedUrl;
  }

  /**
   * Resolve asset URL to absolute path
   * Extracted from frankenstein-ui.js line 1007
   *
   * @param {string} assetPath - Relative or absolute asset path
   * @returns {string} Resolved absolute URL
   */
  resolveAssetUrl(assetPath) {
    if (!assetPath) return '';
    if (/^https?:\/\//.test(assetPath)) {
      return assetPath;
    }

    try {
      return new URL(assetPath, window.location.href).href;
    } catch (error) {
      try {
        const basePath = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}`;
        return new URL(assetPath, basePath).href;
      } catch {
        return assetPath;
      }
    }
  }

  /**
   * Start automatic background rotation
   * Extracted from frankenstein-ui.js line 1025
   *
   * @param {string|null} forceImage - Optional initial image to use
   * @param {number} intervalMs - Rotation interval in milliseconds (default: 45000 = 45 seconds)
   */
  startRotation(forceImage = null, intervalMs = 45000) {
    // Clear any existing rotation
    this.stopRotation();

    // Set initial background
    this.setRandomBackground(forceImage);

    // Start rotation interval
    this.intervalId = setInterval(() => {
      this.setRandomBackground();
    }, intervalMs);
  }

  /**
   * Stop automatic background rotation
   */
  stopRotation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Cleanup - stop rotation and clear state
   */
  destroy() {
    this.stopRotation();
    this.currentIndex = -1;
  }

  /**
   * Update the list of available backgrounds
   * @param {string[]} newBackgrounds - New array of background image paths
   */
  updateBackgrounds(newBackgrounds) {
    if (Array.isArray(newBackgrounds) && newBackgrounds.length > 0) {
      this.backgrounds = newBackgrounds;
      this.currentIndex = -1; // Reset index
    }
  }
}

export default BackgroundRotator;
