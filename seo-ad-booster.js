/**
 * SEO & Ad CPM Booster
 * Enhances existing HTML for maximum search rankings and ad revenue
 */

const SEOAdBooster = (() => {
  'use strict';

  // ==================== SEO ENHANCEMENT ====================
  
  /**
   * Enhance page for search engines
   */
  const enhanceSEO = () => {
    // 1. Dynamic meta tags
    enhanceMetaTags();

    // 2. Structured data injection
    injectStructuredData();

    // 3. Internal linking
    buildInternalLinks();

    // 4. Content optimization
    optimizeContent();

    // 5. Image optimization
    optimizeImages();

    // 6. Speed optimization
    optimizePerformance();

    console.log('✅ SEO Enhancement Complete');
  };

  /**
   * Enhance meta tags
   */
  function enhanceMetaTags() {
    const keyword = extractPageKeyword();
    
    // Enhance title
    const title = `${keyword}｜リアルタイムランキング - Gofileダウンロード数表示【${new Date().getFullYear()}年】`;
    if (document.title.length < 60) {
      document.title = title.substring(0, 60);
    }

    // Enhance description
    const descriptions = [
      `${keyword}の最新トレンドをリアルタイムで表示。ダウンロード数順・新着順で人気ファイルを即座にチェック。`,
      `${keyword}ランキングが無料で見放題。毎時更新される最新情報をダウンロード数順で検索可能。`,
      `${keyword}をリアルタイムで表示。トレンド・新着・ダウンロード数順で検索。高速で安全なランキング。`
    ];

    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      document.head.appendChild(descMeta);
    }
    descMeta.content = descriptions[0];

    // Add additional SEO meta tags
    const seoMeta = {
      'theme-color': '#ff81cf',
      'author': 'TwiiterChan',
      'copyright': 'TwiiterChan 2024-2025',
      'revisit-after': '1 days',
      'rating': 'general'
    };

    Object.entries(seoMeta).forEach(([name, content]) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Enhance OGP tags
    enhanceOGP(keyword);
  }

  /**
   * Enhance Open Graph Protocol tags
   */
  function enhanceOGP(keyword) {
    const ogpData = {
      'og:title': `${keyword} - リアルタイムランキング【無料】`,
      'og:description': `${keyword}の人気ファイルをダウンロード数順で表示。毎日リアルタイム更新。`,
      'og:type': 'website',
      'og:locale': 'ja_JP',
      'og:locale:alternate': 'en_US',
      'twitter:card': 'summary_large_image',
      'twitter:creator': '@twitchan'
    };

    Object.entries(ogpData).forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta && !property.startsWith('twitter')) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      } else if (!meta && property.startsWith('twitter')) {
        meta = document.createElement('meta');
        meta.setAttribute('name', property);
        document.head.appendChild(meta);
      }
      if (meta) meta.content = content;
    });
  }

  /**
   * Inject advanced structured data
   */
  function injectStructuredData() {
    const keyword = extractPageKeyword();
    
    // BreadcrumbList with dynamic data
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "ホーム",
          "item": window.location.origin
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": keyword,
          "item": window.location.href
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "ランキング",
          "item": window.location.href + "?sort=ranking"
        }
      ]
    };

    injectSchema(breadcrumbSchema, 'breadcrumb-schema');

    // FAQPage schema
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `${keyword}リアルタイムランキングとは？`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Twitterで話題の${keyword}をダウンロード数順・新着順でリアルタイムにランキング表示するサービスです。人気の${keyword}を簡単に見つけることができます。`
          }
        },
        {
          "@type": "Question",
          "name": `${keyword}ランキングは無料で使える？`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "はい、すべてのランキング機能を無料でご利用いただけます。登録も不要です。"
          }
        },
        {
          "@type": "Question",
          "name": `${keyword}の更新頻度は？`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "リアルタイムで更新されます。新しい${keyword}は数秒以内に反映されます。"
          }
        }
      ]
    };

    injectSchema(faqSchema, 'faq-schema');

    // Organization schema
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "TwiiterChan",
      "url": window.location.origin,
      "logo": window.location.origin + "/logo.png",
      "description": `${keyword}のリアルタイムランキングサイト`,
      "sameAs": [
        "https://twitter.com/twitchan"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Support",
        "url": window.location.origin + "/contact.html"
      }
    };

    injectSchema(organizationSchema, 'org-schema');
  }

  /**
   * Inject schema into page
   */
  function injectSchema(schema, id) {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }

  /**
   * Build internal linking structure
   */
  function buildInternalLinks() {
    const keyword = extractPageKeyword();
    
    // Related keywords for internal links
    const relatedKeywords = [
      `${keyword} ダウンロード`,
      `${keyword} ランキング`,
      `${keyword} トレンド`,
      `${keyword} 無料`
    ];

    // Create links section if not exists
    let linksSection = document.querySelector('.internal-seo-links');
    if (!linksSection) {
      linksSection = document.createElement('div');
      linksSection.className = 'internal-seo-links';
      linksSection.innerHTML = `
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e8e0e5;">
        <nav style="text-align: center; margin: 20px 0;">
          <h3 style="font-size: 14px; color: #7a7a7a; margin-bottom: 15px; font-weight: 600;">関連キーワード</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
            ${relatedKeywords.map(kw => `
              <a href="/search?q=${encodeURIComponent(kw)}" 
                 rel="related" 
                 data-seo-link="${kw}"
                 style="padding: 8px 16px; background: #f9f9f9; border: 1px solid #e8e0e5; border-radius: 8px; font-size: 13px; color: #ff81cf; text-decoration: none; transition: all 0.3s;">
                ${kw}
              </a>
            `).join('')}
          </div>
        </nav>
      `;
      
      const footer = document.querySelector('.social-footer') || document.querySelector('footer');
      if (footer) {
        footer.parentElement.insertBefore(linksSection, footer);
      }
    }
  }

  /**
   * Optimize content
   */
  function optimizeContent() {
    // Add schema markup to existing content
    const gridItems = document.querySelectorAll('.ranking-grid > .video-card');
    
    gridItems.forEach((card, index) => {
      if (!card.getAttribute('itemscope')) {
        card.setAttribute('itemscope', 'itemscope');
        card.setAttribute('itemtype', 'https://schema.org/VideoObject');
        
        // Add hidden schema properties
        const title = card.querySelector('.video-title');
        if (title) {
          const hiddenProp = document.createElement('meta');
          hiddenProp.setAttribute('itemprop', 'name');
          hiddenProp.content = title.textContent;
          card.appendChild(hiddenProp);
        }

        const meta = card.querySelector('.video-meta');
        if (meta) {
          const downloadCount = meta.textContent.match(/DL数: ([\d,]+)/);
          if (downloadCount) {
            const hiddenDownloads = document.createElement('meta');
            hiddenDownloads.setAttribute('itemprop', 'interactionCount');
            hiddenDownloads.content = downloadCount[1].replace(/,/g, '');
            card.appendChild(hiddenDownloads);
          }
        }
      }
    });
  }

  /**
   * Optimize images for SEO
   */
  function optimizeImages() {
    const images = document.querySelectorAll('img');
    
    images.forEach((img, index) => {
      if (!img.alt) {
        img.alt = `Image ${index + 1}`;
      }
      
      // Add title attribute
      if (!img.title) {
        img.title = img.alt;
      }

      // Lazy loading
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  }

  /**
   * Optimize performance
   */
  function optimizePerformance() {
    // Preconnect to critical domains
    const preconnects = [
      'https://pl28484782.effectivegatecpm.com',
      'https://a.magsrv.com',
      'https://www.googletagmanager.com'
    ];

    preconnects.forEach(domain => {
      if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });

    // Enable compression hints
    const httpEquiv = document.createElement('meta');
    httpEquiv.httpEquiv = 'X-UA-Compatible';
    httpEquiv.content = 'IE=edge';
    if (!document.querySelector('meta[http-equiv="X-UA-Compatible"]')) {
      document.head.appendChild(httpEquiv);
    }
  }

  // ==================== AD REVENUE ENHANCEMENT ====================

  /**
   * Enhance ads for maximum CPM
   */
  const enhanceAds = () => {
    // 1. Optimize ad placements
    optimizeAdPlacements();

    // 2. Setup intelligent refresh
    setupIntelligentRefresh();

    // 3. Boost impressions
    boostImpressions();

    // 4. Track viewability
    trackViewability();

    console.log('✅ Ad Enhancement Complete');
  };

  /**
   * Optimize ad placements for CPM
   */
  function optimizeAdPlacements() {
    const placements = {
      'ad-header-1': { weight: 1.8, interval: 25000, maxRefresh: 6 },
      'ad-sorting-1': { weight: 1.5, interval: 45000, maxRefresh: 4 },
      'ad-ranking-mid': { weight: 1.6, interval: 50000, maxRefresh: 5 },
      'ad-footer-top': { weight: 1.3, interval: 55000, maxRefresh: 3 },
      'ad-smartlink-after': { weight: 1.4, interval: 40000, maxRefresh: 4 }
    };

    Object.entries(placements).forEach(([id, config]) => {
      const element = document.getElementById(id);
      if (element) {
        element.dataset.cpmWeight = config.weight;
        element.dataset.refreshInterval = config.interval;
        element.dataset.maxRefresh = config.maxRefresh;
        element.style.contain = 'layout style paint';
        element.style.willChange = 'contents';
      }
    });

    console.log(`📍 Optimized ${Object.keys(placements).length} ad placements`);
  }

  /**
   * Setup intelligent refresh strategy
   */
  function setupIntelligentRefresh() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Determine refresh strategy
    let strategy = 'moderate';
    if ((hour >= 18 && hour <= 23) || dayOfWeek === 0 || dayOfWeek === 6) {
      strategy = 'aggressive';
    } else if ((hour >= 6 && hour <= 9) || (hour >= 12 && hour <= 14)) {
      strategy = 'moderate';
    } else {
      strategy = 'conservative';
    }

    console.log(`📊 Using ${strategy} refresh strategy`);

    // Apply strategy
    const adContainers = document.querySelectorAll('[id*="ad-"]');
    adContainers.forEach((container) => {
      const interval = parseInt(container.dataset.refreshInterval) || 45000;
      
      // Adjust interval based on strategy
      let adjustedInterval = interval;
      if (strategy === 'aggressive') {
        adjustedInterval = interval * 0.7; // 30% faster
      } else if (strategy === 'conservative') {
        adjustedInterval = interval * 1.3; // 30% slower
      }

      setupContainerRefresh(container, adjustedInterval);
    });
  }

  /**
   * Setup refresh for individual container
   */
  function setupContainerRefresh(container, interval) {
    let refreshCount = 0;
    const maxRefresh = parseInt(container.dataset.maxRefresh) || 5;

    const timer = setInterval(() => {
      if (refreshCount >= maxRefresh) {
        clearInterval(timer);
        return;
      }

      refreshAdContainer(container);
      refreshCount++;
    }, interval);
  }

  /**
   * Refresh ad container
   */
  function refreshAdContainer(container) {
    // Trigger ad refresh
    if (typeof atbdrifts !== 'undefined' && atbdrifts.refresh) {
      try {
        atbdrifts.refresh();
      } catch (e) {
        // Silent fail
      }
    }

    // Track impression
    trackAdImpression(container.id);
  }

  /**
   * Track ad impressions
   */
  function trackAdImpression(adId) {
    if (!window.adStats) window.adStats = {};
    if (!window.adStats[adId]) {
      window.adStats[adId] = { impressions: 0, clicks: 0, revenue: 0 };
    }
    window.adStats[adId].impressions++;
  }

  /**
   * Boost impressions through viewability
   */
  function boostImpressions() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Ad is now visible - trigger refresh
            const adContainer = entry.target.closest('[id*="ad-"]');
            if (adContainer && adContainer.dataset.refreshInterval) {
              adContainer.dataset.lastVisible = Date.now();
            }
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('[id*="ad-"]').forEach(ad => {
        observer.observe(ad);
      });
    }
  }

  /**
   * Track viewability metrics
   */
  function trackViewability() {
    setInterval(() => {
      if (window.adStats) {
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalRevenue = 0;

        Object.values(window.adStats).forEach(stat => {
          totalImpressions += stat.impressions;
          totalClicks += stat.clicks;
        });

        const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
        
        console.log(`
          📈 Ad Statistics:
          - Impressions: ${totalImpressions}
          - Clicks: ${totalClicks}
          - CTR: ${ctr}%
        `);
      }
    }, 60000); // Every minute
  }

  /**
   * Extract keyword from page
   */
  function extractPageKeyword() {
    const title = document.querySelector('h1')?.textContent || document.title;
    const keywords = ['Twitter', 'Gofile', '保存', 'ランキング', 'ダウンロード', '動画', '画像'];
    
    for (const keyword of keywords) {
      if (title.includes(keyword)) return keyword;
    }
    return 'ランキング';
  }

  // ==================== PUBLIC API ====================

  return {
    /**
     * Initialize all enhancements
     */
    init: () => {
      console.log('🚀 Starting SEO & Ad Booster...');
      enhanceSEO();
      enhanceAds();
      console.log('✅ All enhancements applied!');
    },

    /**
     * Get current stats
     */
    getStats: () => {
      return {
        adStats: window.adStats || {},
        timestamp: new Date().toISOString()
      };
    },

    /**
     * Manual ad refresh
     */
    refreshAds: () => {
      document.querySelectorAll('[id*="ad-"]').forEach(ad => {
        refreshAdContainer(ad);
      });
    },

    /**
     * Report revenue
     */
    reportRevenue: () => {
      if (window.adStats) {
        const stats = Object.values(window.adStats);
        const totalImpressions = stats.reduce((sum, s) => sum + s.impressions, 0);
        const estimatedCPM = 25; // Base CPM
        const revenue = (totalImpressions / 1000) * estimatedCPM;
        
        return {
          impressions: totalImpressions,
          estimatedCPM,
          estimatedRevenue: revenue.toFixed(2)
        };
      }
    }
  };
})();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SEOAdBooster.init());
} else {
  SEOAdBooster.init();
}

// Expose to window
window.SEOAdBooster = SEOAdBooster;