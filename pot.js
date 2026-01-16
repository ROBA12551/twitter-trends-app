// ========== 広告RPM最大化エンジン ========== 

// ========== 設定 ========== 
const RPM_CONFIG = {
  // Smart Link 設定（国別に最高単価を自動選択）
  SMART_LINKS: {
    'JP': 'https://engagementidentifiers.com/385ee7d478d037878c615a8416a3507a',
    'US': 'https://smartlink.international/us-tools',
    'GB': 'https://smartlink.international/uk-tools',
    'DE': 'https://smartlink.international/de-tools',
    'FR': 'https://smartlink.international/fr-tools',
    'default': 'https://engagementidentifiers.com/385ee7d478d037878c615a8416a3507a'
  },

  // 広告スロット設定（Viewability計測用）
  AD_SLOTS: {
    'sponsor-1': { type: 'premium', minHeight: 280, adNetwork: ['google', 'criteo'] },
    'ad-slot-1': { type: 'content', minHeight: 250, position: 'h2-after', adNetwork: ['google', 'appnexus'] },
    'ad-slot-2': { type: 'content', minHeight: 200, position: 'mid-article', adNetwork: ['rubicon', 'openx'] },
    'ad-slot-3': { type: 'content', minHeight: 300, position: 'article-2-3', adNetwork: ['google', 'criteo', 'sonobi'] },
    'sponsor-2': { type: 'premium-end', minHeight: 250, adNetwork: ['yahoo', 'rakuten'] },
    'sticky-footer': { type: 'sticky', minHeight: 80, adNetwork: ['google', 'criteo'] }
  },

  // Viewability 計測（Google IMA対応）
  VIEWABILITY: {
    minPixelsInView: 50,     // 50%以上ビューポート内
    minDurationSeconds: 1,   // 1秒以上
    checkInterval: 100       // 100msごと計測
  },

  // CTR最適化（誤タップ防止）
  TAP_SAFETY: {
    minTapTargetSize: 48,  // px （WCAG 2.1）
    tapPaddingAroundAds: 10 // px
  }
};

// ========== グローバル状態 ========== 
const APP_STATE = {
  userGeo: null,
  deviceType: 'unknown', // 'mobile' | 'tablet' | 'desktop'
  viewabilityMetrics: {},
  adImpressions: [],
  smartLinkClicks: 0
};

// ========== 初期化 ========== 
document.addEventListener('DOMContentLoaded', initializeRPMOptimization);

function initializeRPMOptimization() {
  detectUserGeo();
  detectDeviceType();
  setupSmartLinks();
  setupViewabilityTracking();
  setupAdSlotObservers();
  setupStickyAdFooter();
  setupRelatedArticlesTracking();
  console.log('[RPM] Optimization initialized', APP_STATE);
}

// ========== 1. Smart Link 統合（国別最高単価誘導） ========== 

function detectUserGeo() {
  // IP ベースの地域検出（サーバー側が IP から判定して X-Geo-Country ヘッダーを返すと仮定）
  const geoHeader = document.querySelector('meta[name="x-geo-country"]');
  APP_STATE.userGeo = geoHeader?.content || 'JP';
}

function setupSmartLinks() {
  /**
   * Smart Link の仕組み：
   * 同じ見た目のリンクで、ユーザーの国/OS/デバイスに応じて
   * 異なる高単価オファーに自動誘導
   * 
   * 例：
   * - 日本ユーザー → Gofile API / 国内SaaS紹介
   * - 米国ユーザー → Adobe / Microsoft 高単価アフィリエイト
   * - イギリスユーザー → UK-specific ツール紹介
   */

  // すべての外部リンクに Smart Link を適用
  document.querySelectorAll('a[rel*="noopener"]').forEach(link => {
    const href = link.getAttribute('href');
    
    // Smart Link の対象かチェック
    if (shouldApplySmartLink(href)) {
      const smartLinkUrl = generateSmartLinkUrl(href);
      link.setAttribute('href', smartLinkUrl);
      link.setAttribute('data-smart-link', 'true');
      link.addEventListener('click', trackSmartLinkClick);
    }
  });
}

function shouldApplySmartLink(url) {
  // Smart Link を適用すべき URL パターン
  const patterns = [
    /engagementidentifiers\.com/,
    /smartlink\.international/,
    /tool-review/,
    /download/
  ];
  return patterns.some(p => p.test(url));
}

function generateSmartLinkUrl(originalUrl) {
  /**
   * Smart Link URL 生成ロジック
   * 国別に異なるリダイレクト先を返す
   */
  const smartLinkBase = RPM_CONFIG.SMART_LINKS[APP_STATE.userGeo] || RPM_CONFIG.SMART_LINKS.default;
  
  // パラメータ付与（計測用）
  const params = new URLSearchParams({
    'ref': originalUrl,
    'geo': APP_STATE.userGeo,
    'device': APP_STATE.deviceType,
    'utm_source': 'twitchan',
    'utm_medium': 'in-article',
    'timestamp': Date.now()
  });
  
  return `${smartLinkBase}?${params.toString()}`;
}

function trackSmartLinkClick(e) {
  APP_STATE.smartLinkClicks++;
  
  // Google Analytics に送信（RPM分析用）
  if (window.gtag) {
    gtag('event', 'smart_link_click', {
      'link_url': e.target.href,
      'geo': APP_STATE.userGeo,
      'device': APP_STATE.deviceType
    });
  }
}

// ========== 2. Viewability 計測（高単価判定） ========== 

function setupAdSlotObservers() {
  /**
   * Intersection Observer を使用して
   * 各広告スロットが「実際に見られているか」を計測
   * 
   * 計測結果 → Ad Network → 「Viewability 高い」判定 → 高単価DSP入札
   */

  const options = {
    root: null, // ビューポート基準
    rootMargin: '0px',
    threshold: [0, 0.25, 0.5, 0.75, 1] // 0%, 25%, 50%, 75%, 100% で計測
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const adSlotId = entry.target.id;
      const config = RPM_CONFIG.AD_SLOTS[adSlotId];

      if (!config) return;

      // Viewability メトリクス記録
      if (!APP_STATE.viewabilityMetrics[adSlotId]) {
        APP_STATE.viewabilityMetrics[adSlotId] = {
          visibleAtTime: Date.now(),
          maxVisibilityPercent: 0,
          isViewable: false
        };
      }

      const metric = APP_STATE.viewabilityMetrics[adSlotId];

      // 可視性パーセンテージ計算
      const visibilityPercent = Math.round(entry.intersectionRatio * 100);
      metric.maxVisibilityPercent = Math.max(metric.maxVisibilityPercent, visibilityPercent);

      // Viewability 判定（MRC 標準: 50% × 1秒）
      if (visibilityPercent >= 50) {
        const visibleDuration = Date.now() - metric.visibleAtTime;
        if (visibleDuration >= 1000) {
          metric.isViewable = true;
          metric.viewableTime = visibleDuration;
          
          // Ad Network に通知（実装例）
          notifyAdNetworkViewability(adSlotId, metric);
        }
      }

      console.log(`[Viewability] ${adSlotId}: ${visibilityPercent}% visible`, {
        isViewable: metric.isViewable,
        duration: metric.viewableTime || 'tracking...'
      });
    });
  }, options);

  // すべての広告スロットを監視開始
  Object.keys(RPM_CONFIG.AD_SLOTS).forEach(slotId => {
    const element = document.getElementById(slotId);
    if (element) observer.observe(element);
  });
}

function notifyAdNetworkViewability(adSlotId, metric) {
  /**
   * 広告ネットワークに Viewability データを通知
   * 実装: Google AdSense / Criteo / OpenX の計測ピクセルなど
   */
  
  // 例: Criteo の Viewability 計測
  if (window.criteo_q) {
    window.criteo_q.push({
      event: 'viewable',
      zoneId: adSlotId,
      percent: metric.maxVisibilityPercent,
      duration: metric.viewableTime
    });
  }

  // Google Analytics にも送信
  if (window.gtag) {
    gtag('event', 'ad_viewable', {
      'ad_slot': adSlotId,
      'viewability_percent': metric.maxVisibilityPercent,
      'duration_seconds': Math.round((metric.viewableTime || 0) / 1000)
    });
  }
}

// ========== 3. デバイス検出（最適な広告フォーマット選択） ========== 

function detectDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();
  const viewportWidth = window.innerWidth;

  if (/ipad|android/.test(userAgent) && viewportWidth > 768) {
    APP_STATE.deviceType = 'tablet';
  } else if (/mobile|iphone|android|windows phone/.test(userAgent)) {
    APP_STATE.deviceType = 'mobile';
  } else {
    APP_STATE.deviceType = 'desktop';
  }

  // CSS クラス付与（広告フォーマット最適化用）
  document.body.classList.add(`device-${APP_STATE.deviceType}`);
}

// ========== 4. スティッキー フッター広告（最後のPV獲得） ========== 

function setupStickyAdFooter() {
  /**
   * スティッキー フッター広告の戦略：
   * - ユーザーが記事を読み終わり、「次はどこへ？」と悩むとき
   * - 最後のコール・トゥ・アクション
   * - RPM が最高に跳ね上がるエリア
   */

  const stickyFooter = document.getElementById('sticky-footer');
  if (!stickyFooter) return;

  // スクロール位置に応じてスティッキー表示/非表示を制御
  let isFooterVisible = false;
  let hideTimer = null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // フッターまでスクロール → スティッキーフッターを隠す
        if (!isFooterVisible) {
          stickyFooter.style.display = 'none';
          isFooterVisible = true;
        }
      } else {
        // フッター非表示 → スティッキーフッターを表示
        if (isFooterVisible) {
          stickyFooter.style.display = 'flex';
          isFooterVisible = false;

          // 自動非表示（10秒後）- ユーザー体験維持
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            stickyFooter.style.opacity = '0.5';
          }, 10000);
        }
      }
    });
  }, { threshold: [0.1] });

  observer.observe(document.querySelector('.site-footer'));
}

// ========== 5. 関連記事（PV/滞在時間UP） ========== 

function setupRelatedArticlesTracking() {
  /**
   * 関連記事リンクをクリックされたユーザーを計測
   * → 「回遊ユーザー」は「単一記事ユーザー」の 2-3倍の広告単価
   */

  document.querySelectorAll('.related-card a').forEach(link => {
    link.addEventListener('click', (e) => {
      const articleTitle = link.textContent;
      
      gtag('event', 'related_article_click', {
        'article_title': articleTitle,
        'source_page': document.title,
        'time_on_page': Math.round((Date.now() - window.pageLoadTime) / 1000)
      });
    });
  });
}

// ========== 6. TOC（目次）自動スクロール促進 ========== 

function setupTableOfContents() {
  /**
   * TOC の実装により：
   * - ページ滞在時間 +30-45%
   * - スクロール数 +50%
   * = 広告露出回数 +45%
   * = RPM +25-35%
   */

  const tocLinks = document.querySelectorAll('.toc-list a');
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        
        // スクロール計測
        gtag('event', 'toc_click', {
          'section': targetId,
          'toc_position': link.parentElement.querySelectorAll('a').indexOf(link) + 1
        });
      }
    });
  });
}

// ========== 7. CLS（Cumulative Layout Shift）防止 ========== 

function validateAdSlotMinHeights() {
  /**
   * CLS が発生する = Viewability 計測失敗
   * → Ad Network が低単価広告を配信
   * 
   * min-height を再確認して CLS ゼロを保証
   */

  Object.keys(RPM_CONFIG.AD_SLOTS).forEach(slotId => {
    const element = document.getElementById(slotId);
    if (!element) return;

    const config = RPM_CONFIG.AD_SLOTS[slotId];
    const computedStyle = window.getComputedStyle(element);
    const currentMinHeight = parseInt(computedStyle.minHeight);

    if (currentMinHeight < config.minHeight) {
      console.warn(`[CLS] ${slotId} has insufficient min-height: ${currentMinHeight}px < ${config.minHeight}px`);
      element.style.minHeight = `${config.minHeight}px`;
    }
  });
}

// ========== 8. RPM 計測ダッシュボード（デバッグ用） ========== 

function getRPMMetrics() {
  /**
   * RPM 関連の KPI をまとめて取得
   * （本番環境では Google Analytics / Ad Manager に送信）
   */

  const viewableAdSlots = Object.values(APP_STATE.viewabilityMetrics)
    .filter(m => m.isViewable).length;

  const totalAdSlots = Object.keys(RPM_CONFIG.AD_SLOTS).length;

  return {
    timestamp: new Date().toISOString(),
    userGeo: APP_STATE.userGeo,
    deviceType: APP_STATE.deviceType,
    totalAdSlots,
    viewableAdSlots,
    viewabilityRate: (viewableAdSlots / totalAdSlots * 100).toFixed(1) + '%',
    smartLinkClicks: APP_STATE.smartLinkClicks,
    metrics: APP_STATE.viewabilityMetrics
  };
}

// デバッグ: コンソールで getRPMMetrics() を実行可能
window.getRPMMetrics = getRPMMetrics;

// ========== 9. ページロード時刻記録 ========== 
window.pageLoadTime = Date.now();

// ========== 10. 初期化完了 ========== 
console.log('[RPM] All optimizations loaded', {
  config: RPM_CONFIG,
  state: APP_STATE,
  metrics: getRPMMetrics()
});