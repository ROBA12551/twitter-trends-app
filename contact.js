// ========== お問い合わせフォーム機能 ========== 

const CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  DEBOUNCE_DELAY: 300
};

let uploadedFiles = [];

document.addEventListener('DOMContentLoaded', function() {
  setupFileUpload();
  setupFormValidation();
  setupFormSubmission();
  setupFAQ();
});

// ========== ファイルアップロード ========== 

function setupFileUpload() {
  const imageUpload = document.getElementById('imageUpload');
  const fileUploadLabel = document.querySelector('.file-upload-label');
  const fileList = document.getElementById('fileList');

  // クリック選択
  imageUpload.addEventListener('change', handleFileSelect);

  // ドラッグ&ドロップ
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUploadLabel.addEventListener(eventName, preventDefaults);
  });

  fileUploadLabel.addEventListener('dragover', () => {
    fileUploadLabel.style.background = 'var(--bg-light)';
    fileUploadLabel.style.borderColor = 'var(--primary)';
  });

  fileUploadLabel.addEventListener('dragleave', () => {
    fileUploadLabel.style.background = '';
    fileUploadLabel.style.borderColor = '';
  });

  fileUploadLabel.addEventListener('drop', (e) => {
    fileUploadLabel.style.background = '';
    fileUploadLabel.style.borderColor = '';
    imageUpload.files = e.dataTransfer.files;
    handleFileSelect({ target: imageUpload });
  });

  // キーボード操作
  fileUploadLabel.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      imageUpload.click();
    }
  });
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  const fileList = document.getElementById('fileList');
  uploadedFiles = [];
  fileList.innerHTML = '';

  if (files.length === 0) {
    fileList.style.display = 'none';
    return;
  }

  // ファイル検証
  files.forEach((file, index) => {
    const error = validateFile(file);
    if (error) {
      showAlert(`ファイル「${file.name}」: ${error}`, 'error');
      return;
    }

    uploadedFiles.push(file);

    // ファイル表示
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <span>${escapeHTML(file.name)} (${(file.size / 1024).toFixed(2)} KB)</span>
      <button type="button" class="file-remove" onclick="removeFile(${uploadedFiles.length - 1})" aria-label="ファイルを削除">
        削除
      </button>
    `;
    fileList.appendChild(fileItem);
  });

  fileList.style.display = uploadedFiles.length > 0 ? 'block' : 'none';
}

function validateFile(file) {
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    return `ファイルサイズが5MBを超えています (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
  }

  if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return `サポートされていないファイル形式です (${file.type})`;
  }

  if (uploadedFiles.length >= CONFIG.MAX_FILES) {
    return `最大${CONFIG.MAX_FILES}ファイルまでです`;
  }

  return null;
}

window.removeFile = function(index) {
  uploadedFiles.splice(index, 1);
  document.getElementById('imageUpload').value = '';
  handleFileSelect({ target: document.getElementById('imageUpload') });
};

// ========== フォーム検証 ========== 

function setupFormValidation() {
  const form = document.getElementById('reportForm');
  const fields = form.querySelectorAll('input, textarea, select');

  fields.forEach(field => {
    field.addEventListener('blur', validateField);
    field.addEventListener('change', validateField);
  });
}

function validateField(e) {
  const field = e.target;
  const isValid = field.checkValidity();

  if (isValid) {
    field.style.borderColor = '';
  } else {
    field.style.borderColor = 'var(--error)';
  }
}

// ========== フォーム送信 ========== 

function setupFormSubmission() {
  const form = document.getElementById('reportForm');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // フォーム検証
    if (!form.checkValidity()) {
      showAlert('すべての必須フィールドを入力してください', 'error');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>送信中...';

    try {
      // フォームデータ収集
      const formData = new FormData(form);
      const payload = {
        reportType: formData.get('reportType'),
        contentUrl: formData.get('contentUrl'),
        description: formData.get('description'),
        email: formData.get('email'),
        reporterName: formData.get('reporterName'),
        timestamp: new Date().toISOString(),
        uploadedFileCount: uploadedFiles.length
      };

      // 重複チェック
      const lastReport = localStorage.getItem('lastReport');
      if (lastReport) {
        const lastTime = new Date(lastReport).getTime();
        const now = new Date().getTime();
        if (now - lastTime < 60000) { // 60秒以内
          showAlert('別の報告を送信するまでしばらくお待ちください（スパム防止）', 'warning');
          throw new Error('duplicate');
        }
      }

      // サーバー送信
      const response = await fetch('/.netlify/functions/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // 成功
      showAlert('報告を正常に送信しました。ご協力ありがとうございます！', 'success');
      localStorage.setItem('lastReport', new Date().toISOString());
      form.reset();
      document.getElementById('fileList').style.display = 'none';
      uploadedFiles = [];

      // スクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      if (error.message !== 'duplicate') {
        console.error('エラー:', error);
        showAlert(`エラー: ${error.message}`, 'error');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '報告を送信';
    }
  });
}

// ========== FAQ機能 ========== 

function setupFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const summary = item.querySelector('.faq-question');

    summary.addEventListener('click', function(e) {
      e.preventDefault();
      item.toggleAttribute('open');

      // アクセシビリティ
      const isOpen = item.hasAttribute('open');
      summary.setAttribute('aria-expanded', isOpen);
    });

    // キーボード操作
    summary.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        summary.click();
      }
    });
  });
}

// ========== ユーティリティ ========== 

function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert show ${type}`;
  alertDiv.textContent = message;
  alertDiv.role = 'status';
  alertDiv.setAttribute('aria-live', 'polite');

  const form = document.getElementById('reportForm');
  form.parentNode.insertBefore(alertDiv, form);

  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 300);
  }, 5000);
}

function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}