// ========== ポリシーページ機能 ========== 

document.addEventListener('DOMContentLoaded', function() {
  setupPolicyNavigation();
  setupTableOfContents();
  setupPrint();
});

function setupPolicyNavigation() {
  const navButtons = document.querySelectorAll('.nav-button');
  const sections = document.querySelectorAll('.policy-section');

  navButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();

      // ボタンの状態を更新
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // セクションを切り替え
      sections.forEach(section => section.classList.remove('active'));
      const sectionId = button.dataset.section + '-section';
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.classList.add('active');
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // アクセシビリティ更新
      button.setAttribute('aria-selected', 'true');
      navButtons.forEach(btn => {
        if (btn !== button) btn.setAttribute('aria-selected', 'false');
      });
    });

    // キーボード操作サポート
    button.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  });
}

function setupTableOfContents() {
  // 見出しから自動目次を生成（将来実装）
  const headings = document.querySelectorAll('.policy-section h2, .policy-section h3');
  console.log('Found', headings.length, 'headings for potential TOC');
}

function setupPrint() {
  // 印刷ボタン（オプション）
  const printBtn = document.createElement('button');
  printBtn.className = 'btn btn--secondary';
  printBtn.textContent = '🖨️ このページを印刷';
  printBtn.style.marginTop = 'var(--spacing-lg)';
  printBtn.addEventListener('click', () => window.print());

  const lastSection = document.querySelector('.policy-section:last-of-type');
  if (lastSection) {
    lastSection.appendChild(printBtn);
  }
}