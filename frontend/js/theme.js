/**
 * DAYFLOW HRMS — Theme Manager (Light & Dark Mode)
 * Handles instant theme detection, localStorage persistence, OS preference syncing,
 * DOM updates, Chart.js re-coloring, and animated toggle switch interactions.
 */

// Expose globally on window immediately
var DayflowTheme = (function () {
  const STORAGE_KEY = (window.CONFIG && window.CONFIG.STORAGE_KEYS && window.CONFIG.STORAGE_KEYS.THEME) || 'dayflow-theme';

  /**
   * Retrieves current preference from storage or falls back to system preference
   */
  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Fallback to system OS preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // Default Dayflow theme
  }

  /**
   * Applies the theme attribute & classes across DOM elements
   */
  function applyTheme(theme, save = true) {
    const activeTheme = (theme === 'light') ? 'light' : 'dark';

    // 1. Root and Body attributes
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.setAttribute('data-bs-theme', activeTheme);

    if (activeTheme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
      document.body?.classList.add('light-mode', 'light-theme');
      document.body?.classList.remove('dark-mode', 'dark-theme');
    } else {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      document.body?.classList.add('dark-mode', 'dark-theme');
      document.body?.classList.remove('light-mode', 'light-theme');
    }

    // 2. Persist to localStorage if requested
    if (save) {
      localStorage.setItem(STORAGE_KEY, activeTheme);
    }

    // 3. Update all toggle switch buttons on page
    updateToggleButtons(activeTheme);

    // 4. Update Chart.js if instances or libraries exist
    updateCharts(activeTheme);

    // 5. Dispatch global theme change event
    window.dispatchEvent(new CustomEvent('dayflow:themechange', { detail: { theme: activeTheme } }));
  }

  /**
   * Updates state, titles, and aria attributes on all toggle buttons
   */
  function updateToggleButtons(theme) {
    const buttons = document.querySelectorAll('.theme-toggle-btn, #themeToggleBtn');
    buttons.forEach(btn => {
      if (theme === 'light') {
        btn.classList.add('is-light');
        btn.classList.remove('is-dark');
        btn.setAttribute('aria-label', 'Switch to dark mode');
        btn.setAttribute('title', 'Current: Light Mode (Click for Dark Mode)');
      } else {
        btn.classList.add('is-dark');
        btn.classList.remove('is-light');
        btn.setAttribute('aria-label', 'Switch to light mode');
        btn.setAttribute('title', 'Current: Dark Mode (Click for Light Mode)');
      }
    });
  }

  /**
   * Adapts Chart.js global defaults and active instances to current theme
   */
  function updateCharts(theme) {
    if (typeof Chart === 'undefined') return;

    const isLight = theme === 'light';
    const textColor = isLight ? '#475569' : '#94A3B8';
    const gridColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.07)';
    const tooltipBg = isLight ? '#FFFFFF' : '#101722';
    const tooltipTitleColor = isLight ? '#0F172A' : '#FFFFFF';
    const tooltipBodyColor = isLight ? '#334155' : '#CBD5E1';
    const tooltipBorder = isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.12)';

    // Update global defaults if available
    if (Chart.defaults) {
      Chart.defaults.color = textColor;
      if (Chart.defaults.scale) {
        if (Chart.defaults.scale.grid) Chart.defaults.scale.grid.color = gridColor;
        if (Chart.defaults.scale.ticks) Chart.defaults.scale.ticks.color = textColor;
      }
      if (Chart.defaults.plugins && Chart.defaults.plugins.tooltip) {
        Chart.defaults.plugins.tooltip.backgroundColor = tooltipBg;
        Chart.defaults.plugins.tooltip.titleColor = tooltipTitleColor;
        Chart.defaults.plugins.tooltip.bodyColor = tooltipBodyColor;
        Chart.defaults.plugins.tooltip.borderColor = tooltipBorder;
        Chart.defaults.plugins.tooltip.borderWidth = 1;
      }
    }

    // Refresh every registered chart instance
    if (Chart.instances) {
      Object.keys(Chart.instances).forEach(id => {
        const chart = Chart.instances[id];
        if (!chart) return;

        // Update scale grid & ticks
        if (chart.options && chart.options.scales) {
          Object.keys(chart.options.scales).forEach(scaleKey => {
            const scale = chart.options.scales[scaleKey];
            if (scale.grid) scale.grid.color = gridColor;
            if (scale.ticks) scale.ticks.color = textColor;
          });
        }

        // Update plugin tooltip
        if (chart.options && chart.options.plugins && chart.options.plugins.tooltip) {
          chart.options.plugins.tooltip.backgroundColor = tooltipBg;
          chart.options.plugins.tooltip.titleColor = tooltipTitleColor;
          chart.options.plugins.tooltip.bodyColor = tooltipBodyColor;
          chart.options.plugins.tooltip.borderColor = tooltipBorder;
        }

        chart.update('none'); // Update without disrupting animations
      });
    }
  }

  /**
   * Toggles between light and dark themes
   */
  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next, true);

    // Optional subtle feedback toast if notifications manager is loaded
    if (window.DayflowNotifications && typeof window.DayflowNotifications.showToast === 'function') {
      window.DayflowNotifications.showToast(
        next === 'light' ? 'Switched to Light Mode ☀️' : 'Switched to Dark Mode 🌙',
        'info'
      );
    }
  }

  /**
   * Initialize theme system
   */
  function init() {
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme, false);

    // Listen for system theme changes if user has no stored preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
          applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }

    // Bind theme buttons once DOM is fully ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        updateToggleButtons(document.documentElement.getAttribute('data-theme') || initialTheme);
      });
    } else {
      updateToggleButtons(document.documentElement.getAttribute('data-theme') || initialTheme);
    }
  }

  // Self-execute immediate init on script load to prevent FOUT
  init();

  return {
    init,
    toggle,
    setTheme: applyTheme,
    getTheme: () => document.documentElement.getAttribute('data-theme') || getPreferredTheme(),
    updateCharts
  };
})();

// Expose globally
window.DayflowTheme = DayflowTheme;
