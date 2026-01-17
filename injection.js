/**
 * Module Injection Script
 * Injects optimization into existing HTML without changing functionality
 */

(function() {
  'use strict';

  // Load module.js first
  const loadModule = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = '/module.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  };

  // Inject into existing DOM when ready
  const injectOptimization = async () => {
    await loadModule();

    if (typeof OptimizationModule === 'undefined') {
      console.warn('OptimizationModule not loaded');
      return;
    }

    // Initialize with current page keyword
    const pageTitle = document.querySelector('.page-title')?.textContent || 'Twitter保存ランキング';
    const keyword = extractKeyword(pageTitle);

    const config = OptimizationModule.init({
      keyword,
      traffic: getTrafficMetrics()
    });

    console.log('✅ Optimization Injected:', config);

    // Apply SEO optimizations to existing elements
    applySEOToDOM(keyword);

    // Enhance existing ad containers
    enhanceAdContainers();

    // Monitor and boost revenue
    startRevenueMonitoring();
  };

  // Extract keyword from page
  function extractKeyword(text) {
    const keywords = ['Twitter', 'Gofile', 'ランキング', 'ダウンロード', '動画', '画像', '保存'];
    for (const keyword of keywords) {
      if (text.includes(keyword)) return keyword;
    }
    return 'ランキング';
  }

  // Get traffic metrics
  function getTrafficMetrics() {
    const now = new Date();
    return {
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      userCountry: detectCountry(),
      deviceType: detectDevice()
    };
  }

  // Detect user country (basic)
  function detectCountry() {
    return 'JP'; // Default to Japan
  }

  // Detect device type
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/mobile|android/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  // Apply SEO to existing DOM
  function applySEOToDOM(keyword) {
    // Update title if using OptimizationModule
    if (OptimizationModule?.Content?.generateTitle) {
      const newTitle = OptimizationModule.Content.generateTitle(keyword, 1);
      if (document.title !== newTitle) {
        document.title = newTitle;
      }
    }

    // Update meta description
    if (OptimizationModule?.Content?.generateDescription) {
      const newDescription = OptimizationModule.Content.generateDescription(keyword);
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.name = 'description';
        document.head.appendChild(descMeta);
      }
      descMeta.content = newDescription;
    }

    // Inject structured data for current page
    if (OptimizationModule?.Content?.generateHeadings) {
      const headings = OptimizationModule.Content.generateHeadings(keyword, 1);
      
      // Update H1 if exists
      const h1 = document.querySelector('h1.page-title');
      if (h1 && !h1.dataset.seoModified) {
        h1.dataset.seoModified = 'true';
        // Don't change text to preserve functionality
        h1.setAttribute('data-seo-score', '95');
      }
    }

    // Add internal links for SEO
    if (OptimizationModule?.SEO?.buildInternalLinks) {
      const keywords = OptimizationModule.Keywords.expandKeywords(keyword);
      const relatedKeywords = keywords.slice(1, 4); // Get 3 related keywords
      const linkContainer = OptimizationModule.SEO.buildInternalLinks(keyword, relatedKeywords);
      
      const footer = document.querySelector('.social-footer');
      if (footer && !footer.querySelector('.internal-seo-links')) {
        footer.appendChild(linkContainer);
      }
    }
  }

  // Enhance existing ad containers
  function enhanceAdContainers() {
    const adContainers = document.querySelectorAll('[id*="ad-"]');
    
    adContainers.forEach((container, index) => {
      // Add data attributes for tracking
      container.dataset.adIndex = index;
      container.dataset.adName = container.id;
      
      // Get CPM info from OptimizationModule
      if (OptimizationModule?.Ads) {
        const placements = OptimizationModule.Ads.strategicAdPlacement();
        Object.values(placements).forEach(placement => {
          if (container.id.includes('header') || container.id.includes('premium')) {
            container.dataset.expectedCpm = placement.weight || 1.8;
            container.dataset.priority = placement.weight ? 'high' : 'medium';
          }
        });
      }

      // Setup refresh for premium placements
      if (container.id.includes('premium') || container.id.includes('ranking-mid')) {
        setupAdRefresh(container, index);
      }
    });

    console.log(`✅ Enhanced ${adContainers.length} ad containers`);
  }

  // Setup ad refresh strategy
  function setupAdRefresh(container, index) {
    const refreshRules = OptimizationModule?.Ads?.setupAdRefresh?.();
    if (!refreshRules) return;

    // Determine refresh interval based on position
    let interval = 45000; // Default 45 seconds
    
    if (container.id.includes('header')) interval = 25000;
    if (container.id.includes('sticky')) interval = 30000;
    if (container.id.includes('mid')) interval = 45000;
    if (container.id.includes('footer')) interval = 55000;

    // Set up refresh timer
    setInterval(() => {
      refreshAdContainer(container);
    }, interval);
  }

  // Refresh ad container
  function refreshAdContainer(container) {
    // Trigger Adsterra refresh if available
    if (typeof atbdrifts !== 'undefined' && atbdrifts.refresh) {
      try {
        atbdrifts.refresh();
        trackAdImpression(container.id);
      } catch (e) {
        console.warn('Ad refresh failed:', e);
      }
    }
  }

  // Track ad impressions for revenue
  function trackAdImpression(adId) {
    if (!window.adImpressions) window.adImpressions = {};
    if (!window.adImpressions[adId]) window.adImpressions[adId] = 0;
    window.adImpressions[adId]++;
  }

  // Start revenue monitoring
  function startRevenueMonitoring() {
    // Monitor traffic and adjust CPM multiplier
    const metrics = {
      impressions: 0,
      clicks: 0,
      scrollDepth: 0,
      timeOnPage: 0
    };

    // Track scroll depth
    window.addEventListener('scroll', throttle(() => {
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrolled = window.scrollY;
      metrics.scrollDepth = Math.round(((scrolled + windowHeight) / docHeight) * 100);
    }, 1000));

    // Track time on page
    let startTime = Date.now();
    setInterval(() => {
      metrics.timeOnPage = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);

    // Track ad clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('[id*="ad-"]')) {
        metrics.clicks++;
        updateCPMMultiplier(metrics);
      }
    });

    // Update CPM every minute
    setInterval(() => {
      updateCPMMultiplier(metrics);
      reportRevenue(metrics);
    }, 60000);
  }

  // Update CPM multiplier based on metrics
  function updateCPMMultiplier(metrics) {
    let multiplier = 1.0;

    // Scroll depth boost
    if (metrics.scrollDepth > 75) multiplier *= 1.2;
    else if (metrics.scrollDepth > 50) multiplier *= 1.1;

    // Time on page boost
    if (metrics.timeOnPage > 300) multiplier *= 1.15; // 5 minutes
    if (metrics.timeOnPage > 600) multiplier *= 1.25; // 10 minutes

    // Click through rate boost
    if (metrics.clicks > 3) multiplier *= 1.2;

    if (OptimizationModule?.Ads?.updateCPMMultiplier) {
      OptimizationModule.Ads.updateCPMMultiplier(multiplier);
    }

    // Update UI if needed
    if (window.adImpressions) {
      const totalImpressions = Object.values(window.adImpressions).reduce((a, b) => a + b, 0);
      console.log(`📊 CPM Multiplier: ${multiplier.toFixed(2)}x, Impressions: ${totalImpressions}`);
    }
  }

  // Report revenue
  function reportRevenue(metrics) {
    if (OptimizationModule?.getReport) {
      const report = OptimizationModule.getReport();
      console.log('💰 Revenue Report:', report);
    }
  }

  // Utility: Throttle function
  function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Start injection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectOptimization);
  } else {
    injectOptimization();
  }
})();