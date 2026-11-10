/**
 * Wedding Invitation Template - Vĩnh Hoàng 💕 Xoan Xoan
 * Full Interactive Script + Dynamic Album Expansion + Multi-Bank STK VietQR + Live Admin Sync
 */
(function () {
  'use strict';

  const BASE_ORIGINAL_HEIGHT = 6098;
  const ALBUM_BASE_IDS = ['UcDLG0Lwdb', '0bO3jdlyXM', 'dMR_eXmVl5', 'W8Vif08Igq', 'kRELoZIslv', 'Tx6I9i67c5'];
  const ALBUM_START_TOP = 3685.92;
  const ALBUM_ROW_STEP = 294;
  const BRIDE_SECTION_THRESHOLD = 3620;
  const BELOW_ALBUM_THRESHOLD = 4560;
  const BRIDE_SECTION_HEIGHT = 1080;

  let currentBrideOffset = BRIDE_SECTION_HEIGHT;
  let currentAlbumDeltaY = 0;
  let currentGroomMapAddress = "21°05'04.7\"N 106°09'27.9\"E";

  const DEFAULT_BRIDE_SECTION = {
    "enabled": true,
    "partyTitle": "Tiệc Mừng Lễ Vu Quy",
    "partySub": "được tổ chức vào lúc",
    "time": "8h30",
    "dayOfWeek": "Chủ Nhật",
    "day": "29",
    "month": "Tháng 11",
    "year": "Năm 2026",
    "lunarDate": "(Tức ngày 28 tháng 10 năm Bính Ngọ)",
    "venueHeader": "Địa điểm tổ chức",
    "venueName": "Tư gia nhà gái",
    "venueAddress": "Yên Việt, Đông Cứu - Bắc Ninh",
    "mapAddress": "21°03'52.9\"N 106°09'35.2\"E",
    "calendarDate": "2026-11-29"
};

  const CONFIG = {
    baseWidth: 404,
    baseHeight: BASE_ORIGINAL_HEIGHT,
    weddingDate: '2026-11-29T12:00:00+07:00',
    autoScrollEnabled: true,
    autoScrollSpeed: 0.65,
    initialLikes: 18,
    avatarColors: ['#f9d5dc', '#fde2c8', '#d8ecd9', '#d6e6f7', '#e5dcf5', '#f6e3b4'],
    defaultWishes: [
      {
        senderName: 'Minh Tuấn & Ngọc Lan',
        content: 'Chúc Vĩnh Hoàng và Xoan Xoan trăm năm hạnh phúc, mãi mãi yêu thương nhau như ngày đầu nhé! 💕',
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
      },
      {
        senderName: 'Thu Hà',
        content: 'Cô dâu xinh quá! Chúc hai bạn có một đám cưới thật trọn vẹn và sớm đón thiên thần nhỏ nha 🥰',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      },
      {
        senderName: 'Hội bạn cấp 3 Bắc Ninh',
        content: 'Chúc mừng hạnh phúc đôi trẻ! Ngày vui nhất định bọn mình sẽ có mặt đông đủ quậy tới bến 🎉🥂',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString()
      },
      {
        senderName: 'Gia đình chú Hùng',
        content: 'Chúc hai cháu trăm năm tình viên mãn, bạc đầu nghĩa phu thê, gia đình ấm êm hạnh phúc!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString()
      },
      {
        senderName: 'Hoàng Nam',
        content: 'Happy Wedding Vĩnh Hoàng & Xoan Xoan! Chúc hai bạn luôn tràn ngập tiếng cười ❤️',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString()
      }
    ]
  };

  // Record original top positions of all top-level nodes inside #canvas-scaler so we can shift nodes below album cleanly
  const originalNodeTops = new Map();
  document.querySelectorAll('#canvas-scaler > div > [style*="top:"]').forEach((el) => {
    const topMatch = el.getAttribute('style').match(/top:\s*([0-9.]+)px/);
    if (topMatch) {
      originalNodeTops.set(el, parseFloat(topMatch[1]));
    }
  });

  // Force mobile card view if inside Admin Live Preview iframe (?preview=mobile)
  const isPreviewIframe = window.location.search.includes('preview=mobile');
  if (isPreviewIframe) {
    document.documentElement.classList.add('force-mobile-preview');
    const style = document.createElement('style');
    style.textContent = `
      .feedLayout_feed__jIIvL { display: block !important; width: 100vw !important; height: 100vh !important; }
      .feedLayout_side__cEJ5f, .feedLayout_rail__LjcAO, .feedLayout_nav__kz5dq, .feedLayout_panel__amdTn { display: none !important; }
      .feedLayout_stage__zQjhY, .feedLayout_cardRow__36Grw, .feedLayout_card__Nx6Wg {
        padding: 0 !important; width: 100vw !important; height: 100vh !important; border-radius: 0 !important; box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Add quick Admin link in left sidebar promo area (only on localhost or ?admin=1 so guests on GitHub Pages don't see it)
  const isLocalHost = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  if (!isPreviewIframe && (isLocalHost || window.location.search.includes('admin=1'))) {
    const sideFoot = document.querySelector('.feedLayout_sideFoot__AckKV');
    if (sideFoot) {
      const adminLink = document.createElement('a');
      adminLink.href = 'admin.html';
      adminLink.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:8px 14px;border-radius:18px;background:#161823;color:#fff;font-size:12.5px;font-weight:600;text-decoration:none;width:fit-content;';
      adminLink.innerHTML = '⚙️ Trang quản trị điền thông tin';
      sideFoot.parentNode.insertBefore(adminLink, sideFoot);
    }
  }

  // --- 1. TOAST HELPER ---
  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById('cl-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- 2. RESPONSIVE CANVAS SCALING ---
  const cardEl = document.querySelector('.feedLayout_card__Nx6Wg');
  const rootContainer = document.getElementById('root-page-container');
  const canvasScaler = document.getElementById('canvas-scaler');

  function updateCardScale() {
    if (!rootContainer || !canvasScaler || !cardEl) return;
    const isMobile = isPreviewIframe || window.matchMedia('(max-width: 768px)').matches;
    let targetWidth;

    if (isMobile) {
      targetWidth = window.innerWidth;
      cardEl.style.width = targetWidth + 'px';
    } else {
      const stageHeight = window.innerHeight - 32;
      targetWidth = Math.min(500, Math.round(0.55 * stageHeight));
      cardEl.style.width = targetWidth + 'px';
    }

    const scale = targetWidth / CONFIG.baseWidth;
    const scaledHeight = Math.round(CONFIG.baseHeight * scale);

    rootContainer.style.width = targetWidth + 'px';
    rootContainer.style.height = scaledHeight + 'px';
    canvasScaler.style.height = CONFIG.baseHeight + 'px';
    canvasScaler.style.transform = `scale(${scale})`;
  }

  window.addEventListener('resize', updateCardScale);
  updateCardScale();

  // --- 3. SCROLL-TRIGGERED ENTRANCE ANIMATIONS ---
  const scrollRoot = document.querySelector('[data-autoscroll-root]');
  let transitionObserver = null;

  function initScrollAnimations() {
    const transitionElements = document.querySelectorAll('[data-transition-key]');
    // Always make all elements visible immediately so mobile WebViews (Zalo, iOS Safari)
    // never leave photos or text stuck at opacity:0 inside scaled containers
    transitionElements.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  initScrollAnimations();

  // --- 4. BACKGROUND MUSIC & AUDIO TOGGLE ---
  const audioControl = document.getElementById('audio-control-wrapper');
  const audioToggle = audioControl ? audioControl.querySelector('.audio-toggle') : null;
  const iconCancel = audioControl ? audioControl.querySelector('.icon-cancel') : null;
  const audioEl = document.querySelector('audio');
  let userToggledAudio = false;

  function updateAudioUI(playing) {
    if (!audioToggle) return;
    if (playing) {
      audioToggle.classList.add('mrotate');
      if (iconCancel) iconCancel.style.display = 'none';
    } else {
      audioToggle.classList.remove('mrotate');
      if (iconCancel) iconCancel.style.display = 'block';
    }
  }

  function toggleAudio() {
    if (!audioEl) return;
    userToggledAudio = true;
    if (audioEl.paused) {
      audioEl.play().then(() => updateAudioUI(true)).catch(() => {});
    } else {
      audioEl.pause();
      updateAudioUI(false);
    }
  }

  if (audioControl && audioEl) {
    audioEl.loop = true;
    audioControl.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAudio();
    });

    if (!isPreviewIframe) {
      audioEl.play().then(() => updateAudioUI(true)).catch(() => {
        updateAudioUI(false);
        const startOnGesture = () => {
          if (!userToggledAudio && audioEl.paused) {
            audioEl.play().then(() => updateAudioUI(true)).catch(() => {});
          }
          window.removeEventListener('click', startOnGesture);
          window.removeEventListener('touchstart', startOnGesture);
        };
        window.addEventListener('click', startOnGesture, { once: true });
        window.addEventListener('touchstart', startOnGesture, { once: true });
      });
    } else {
      updateAudioUI(false);
    }
  }

  // --- 5. SMOOTH AUTO-SCROLL & UP/DOWN NAVIGATION ---
  let autoScrollActive = !isPreviewIframe;
  let autoScrollResumeTimer = null;
  let scrollAccumulator = 0;

  function pauseAutoScrollTemporarily(ms = 4500) {
    autoScrollActive = false;
    clearTimeout(autoScrollResumeTimer);
    autoScrollResumeTimer = setTimeout(() => {
      if (CONFIG.autoScrollEnabled && !isPreviewIframe) {
        autoScrollActive = true;
      }
    }, ms);
  }

  if (scrollRoot) {
    ['wheel', 'touchstart', 'touchmove', 'mousedown'].forEach((evt) => {
      scrollRoot.addEventListener(evt, () => pauseAutoScrollTemporarily(5000), { passive: true });
    });

    function autoScrollStep() {
      if (autoScrollActive && CONFIG.autoScrollEnabled && scrollRoot) {
        const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
        if (scrollRoot.scrollTop < maxScroll - 2) {
          scrollAccumulator += CONFIG.autoScrollSpeed;
          if (scrollAccumulator >= 1) {
            const px = Math.floor(scrollAccumulator);
            scrollRoot.scrollTop += px;
            scrollAccumulator -= px;
          }
        }
      }
      requestAnimationFrame(autoScrollStep);
    }
    requestAnimationFrame(autoScrollStep);
  }

  const navBtns = document.querySelectorAll('.feedLayout_navBtn__zS4dx');
  if (navBtns.length >= 2 && scrollRoot) {
    navBtns[0].addEventListener('click', () => {
      pauseAutoScrollTemporarily(6000);
      scrollRoot.scrollBy({ top: -scrollRoot.clientHeight * 0.75, behavior: 'smooth' });
    });
    navBtns[1].addEventListener('click', () => {
      pauseAutoScrollTemporarily(6000);
      scrollRoot.scrollBy({ top: scrollRoot.clientHeight * 0.75, behavior: 'smooth' });
    });
  }

  // --- 6. LIVE COUNTDOWN & DYNAMIC CALENDAR RENDERER ---
  const countdownEl = document.querySelector('.countdown');
  function updateCountdown() {
    if (!countdownEl) return;
    let targetTime = new Date(CONFIG.weddingDate).getTime();
    if (Number.isNaN(targetTime)) targetTime = Date.now() + 86400000 * 30;
    const now = Date.now();
    while (targetTime <= now) {
      targetTime += 1000 * 60 * 60 * 24 * 45;
    }
    const diff = Math.max(0, targetTime - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const boxes = countdownEl.children;
    if (boxes.length >= 4) {
      const vals = [days, hours, minutes, seconds];
      for (let i = 0; i < 4; i++) {
        const numEl = boxes[i].firstElementChild;
        if (numEl) numEl.textContent = String(vals[i]).padStart(2, '0');
      }
    }
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  function renderCalendarWidget(dateStr, targetSelector = '[data-node-id="ZdBuV7JhdB"] .calendar .template-one') {
    const parts = (dateStr || '2026-10-04').split('-').map((n) => parseInt(n, 10));
    if (parts.length !== 3 || parts.some(Number.isNaN)) return;
    const [year, month, selectedDay] = parts;

    const calEl = document.querySelector(targetSelector);
    if (!calEl) return;
    const headEl = calEl.querySelector('.one-head');
    const bodyEl = calEl.querySelector('.one-body');

    if (headEl) headEl.textContent = `${String(month).padStart(2, '0')}.${year}`;

    if (bodyEl) {
      const firstDayJs = new Date(year, month - 1, 1).getDay();
      const emptyLeading = (firstDayJs + 6) % 7;
      const daysInMonth = new Date(year, month, 0).getDate();
      const totalCells = 35;

      let html = `
        <div class="body-week">T2</div>
        <div class="body-week">T3</div>
        <div class="body-week">T4</div>
        <div class="body-week">T5</div>
        <div class="body-week">T6</div>
        <div class="body-week">T7</div>
        <div class="body-week">CN</div>
      `;

      for (let i = 0; i < emptyLeading; i++) {
        html += `<div class="empty"><div></div></div>`;
      }
      for (let d = 1; d <= daysInMonth; d++) {
        if (d === selectedDay) {
          html += `<div><img class="heart-date" src="assets/calen_heart_1.png" alt="heart"/><div class="colorF">${d}</div></div>`;
        } else {
          html += `<div><div>${d}</div></div>`;
        }
      }
      const used = emptyLeading + daysInMonth;
      const trailing = Math.max(0, totalCells - used);
      for (let i = 0; i < trailing; i++) {
        html += `<div class="empty"><div></div></div>`;
      }
      html += `<div class="body-year">${String(month).padStart(2, '0')}</div>`;
      bodyEl.innerHTML = html;
    }
  }

  // --- 7. WISHES / BLESSINGS & RIGHT PANEL TABS ---
  let wishes = [];
  function sanitizeLegacyNames(str) {
    if (!str || typeof str !== 'string') return str;
    return str
      .replace(/Đức\s*Huy|Đức\s*Huy/gi, 'Vĩnh Hoàng')
      .replace(/Nguyễn\s*Hường|Nguyễn\s*Hường/gi, 'Xoan Xoan');
  }

  function loadWishesFromStorage() {
    try {
      const saved = localStorage.getItem('cl_huy11_wishes');
      if (saved) {
        const cleaned = sanitizeLegacyNames(saved);
        if (cleaned !== saved) localStorage.setItem('cl_huy11_wishes', cleaned);
        wishes = JSON.parse(cleaned);
      } else {
        wishes = [...CONFIG.defaultWishes];
      }
    } catch (e) {
      wishes = [...CONFIG.defaultWishes];
    }
  }
  loadWishesFromStorage();

  function saveWishes() {
    try {
      localStorage.setItem('cl_huy11_wishes', JSON.stringify(wishes));
    } catch (e) {}
  }

  function getAvatarColor(name) {
    let hash = 0;
    const str = name || '?';
    for (let i = 0; i < str.length; i++) {
      hash = (31 * hash + str.charCodeAt(i)) >>> 0;
    }
    return CONFIG.avatarColors[hash % CONFIG.avatarColors.length];
  }

  function formatRelativeTime(iso) {
    if (!iso) return 'vừa xong';
    const time = new Date(iso).getTime();
    if (Number.isNaN(time)) return 'vừa xong';
    const mins = Math.floor((Date.now() - time) / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return days <= 30 ? `${days} ngày trước` : new Date(iso).toLocaleDateString('vi-VN');
  }

  const panelBody = document.querySelector('.feedLayout_panelBody__k__ER');
  const panelComposer = document.querySelector('.feedLayout_composer__jG6zI');
  const panelTabs = document.querySelectorAll('.feedLayout_tab__7xtYZ');
  const railActions = document.querySelectorAll('.feedLayout_railAction__ChcBD');
  let activeTab = 'wishes';

  function renderRightPanel() {
    if (!panelBody) return;

    if (railActions.length >= 1) {
      const lbl = railActions[0].querySelector('.feedLayout_railLabel__teHXs');
      if (lbl) lbl.textContent = wishes.length > 0 ? String(wishes.length) : 'Lời chúc';
    }

    if (activeTab === 'wishes') {
      if (panelComposer) panelComposer.style.display = 'flex';
      panelBody.className = 'feedLayout_panelBody__k__ER';
      const itemsHtml = wishes
        .map((w) => {
          const initial = (w.senderName || '?').trim().charAt(0).toUpperCase();
          const bg = getAvatarColor(w.senderName);
          return `
            <li class="feedLayout_wish__lDCH6">
              <span class="feedLayout_wishAvatar__C_nQe" style="background:${bg}" aria-hidden="true">${escapeHtml(initial)}</span>
              <div class="feedLayout_wishBody__NrIPu">
                <p class="feedLayout_wishName__6ssZ1">${escapeHtml(w.senderName)}</p>
                <p class="feedLayout_wishText__OhxWy">${escapeHtml(w.content)}</p>
                <p class="feedLayout_wishTime__rVU4P">${formatRelativeTime(w.createdAt)}</p>
              </div>
            </li>
          `;
        })
        .join('');

      panelBody.innerHTML = `
        <p class="feedLayout_count__r6jnL">${wishes.length} lời chúc</p>
        <ul class="feedLayout_wishes__B6nuM">${itemsHtml}</ul>
      `;
    } else {
      if (panelComposer) panelComposer.style.display = 'none';
      panelBody.className = 'feedLayout_panelBody__k__ER feedLayout_phone__0XPzZ';
      const shareUrl = window.location.href.split('?')[0];
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;
      panelBody.innerHTML = `
        <div class="feedLayout_qr__vIsmk">
          <img src="${qrSrc}" alt="QR Code xem trên điện thoại" width="180" height="180" style="display:block;border-radius:8px" />
        </div>
        <p class="feedLayout_phoneTitle__qyxXB">Mở thiệp trên điện thoại</p>
        <p class="feedLayout_phoneText__JxlqR">Quét mã bằng camera để xem thiệp đúng như trên điện thoại.</p>
        <button type="button" class="feedLayout_copyBtn__FyuBY" id="copy-link-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          Sao chép link thiệp
        </button>
      `;
      const copyBtn = document.getElementById('copy-link-btn');
      if (copyBtn) copyBtn.addEventListener('click', copyShareLink);
    }
  }

  const blessingBox = document.getElementById('blessing-box');
  function renderBlessingBox() {
    if (!blessingBox) return;
    if (wishes.length === 0) {
      blessingBox.style.opacity = '0';
      return;
    }
    blessingBox.style.opacity = '1';
    const itemsHtml = wishes
      .map(
        (w) => `
        <div class="jsx-3173425662 blessing-message">
          <strong>${escapeHtml(w.senderName)}:</strong>&nbsp;${escapeHtml(w.content)}
        </div>
      `
      )
      .join('');

    const duration = Math.max(12, wishes.length * 4);
    blessingBox.innerHTML = `
      <div class="jsx-3173425662 blessing-offset">
        <div class="jsx-3173425662 blessing-track" data-running="true" style="animation-duration: ${duration}s">
          <div class="jsx-3173425662 blessing-copy">${itemsHtml}</div>
          <div class="jsx-3173425662 blessing-copy">${itemsHtml}</div>
        </div>
      </div>
    `;
  }

  function switchTab(tab) {
    activeTab = tab;
    panelTabs.forEach((btn, idx) => {
      const isSelected = (idx === 0 && tab === 'wishes') || (idx === 1 && tab === 'phone');
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
    renderRightPanel();
  }

  panelTabs.forEach((btn, idx) => {
    btn.addEventListener('click', () => switchTab(idx === 0 ? 'wishes' : 'phone'));
  });

  renderRightPanel();
  renderBlessingBox();

  // --- 8. MODALS & ACTIONS (WISHES, GIFTS, SHARE, QR) ---
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
  }

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
  });
  document.querySelectorAll('.cl-modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });

  function copyShareLink() {
    const url = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/thiep.html');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => showToast('Đã sao chép link thiệp! 🔗'));
    } else {
      showToast('Link thiệp: ' + url);
    }
  }

  if (railActions.length >= 4) {
    railActions[0].addEventListener('click', () => {
      switchTab('wishes');
      openModal('wish-modal');
    });
    railActions[1].addEventListener('click', () => openModal('gift-modal'));
    railActions[2].addEventListener('click', copyShareLink);
    railActions[3].addEventListener('click', () => switchTab('phone'));
  }

  const cardMessageBtn = document.querySelector('.message-box-button');
  if (cardMessageBtn) cardMessageBtn.addEventListener('click', () => openModal('wish-modal'));

  const composerInput = document.querySelector('.feedLayout_composerInput__z_xii');
  const composerSend = document.querySelector('.feedLayout_composerSend___t0vF');
  if (composerInput) composerInput.addEventListener('click', () => openModal('wish-modal'));
  if (composerSend) composerSend.addEventListener('click', () => openModal('wish-modal'));

  const wishForm = document.getElementById('wish-form');
  const wishSender = document.getElementById('wish-sender');
  const wishContent = document.getElementById('wish-content');
  document.querySelectorAll('.cl-wish-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (wishContent) wishContent.value = chip.textContent;
    });
  });

  if (wishForm) {
    wishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const senderName = (wishSender.value || '').trim();
      const content = (wishContent.value || '').trim();
      if (!senderName || !content) return;

      wishes.unshift({
        senderName,
        content,
        createdAt: new Date().toISOString()
      });
      saveWishes();
      switchTab('wishes');
      renderBlessingBox();
      wishForm.reset();
      closeModal('wish-modal');
      burstHearts(18);
      showToast('Cảm ơn bạn đã gửi lời chúc! 💕');
    });
  }

  // --- 9. HEART SHOOTING CANVAS, LIKES & GIFTS ---
  const canvas = document.getElementById('cinelove-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [];
  let animFrameId = null;

  function resizeCanvas() {
    if (!canvas || !cardEl) return;
    canvas.width = cardEl.clientWidth || 404;
    canvas.height = cardEl.clientHeight || 700;
  }
  window.addEventListener('resize', resizeCanvas);
  setTimeout(resizeCanvas, 100);

  function drawHeart(c, x, y, size, color, alpha, rotation) {
    c.save();
    c.translate(x, y);
    c.rotate(rotation);
    c.globalAlpha = Math.max(0, alpha);
    c.fillStyle = color;
    c.beginPath();
    const topCurveHeight = size * 0.3;
    c.moveTo(0, topCurveHeight);
    c.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
    c.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, (size + topCurveHeight) / 1.4, 0, size);
    c.bezierCurveTo(0, (size + topCurveHeight) / 1.4, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
    c.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
    c.closePath();
    c.fill();
    c.restore();
  }

  function animateParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter((p) => p.alpha > 0.02);

    for (const p of particles) {
      p.x += p.vx + Math.sin(p.life * 0.06) * 0.6;
      p.y += p.vy;
      p.vy *= 0.99;
      p.life += 1;
      if (p.life > 35) p.alpha -= 0.016;
      drawHeart(ctx, p.x, p.y, p.size, p.color, p.alpha, p.rotation);
    }

    if (particles.length > 0) {
      animFrameId = requestAnimationFrame(animateParticles);
    } else {
      animFrameId = null;
    }
  }

  function burstHearts(count = 12) {
    if (!canvas) return;
    resizeCanvas();
    const colors = ['#ff4969', '#ff758c', '#ff9aa6', '#e8436a', '#ffb3c1', '#ff2a55'];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width * (0.25 + Math.random() * 0.5),
        y: canvas.height * (0.75 + Math.random() * 0.18),
        vx: (Math.random() - 0.5) * 2.4,
        vy: -(2.2 + Math.random() * 3.2),
        size: 12 + Math.random() * 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.95,
        rotation: (Math.random() - 0.5) * 0.5,
        life: 0
      });
    }
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(animateParticles);
    }
  }

  const likeBtn = document.getElementById('cinelove-like-button');
  let likeCount = CONFIG.initialLikes;
  try {
    const savedLikes = localStorage.getItem('cl_huy11_likes');
    if (savedLikes) likeCount = parseInt(savedLikes, 10) || CONFIG.initialLikes;
  } catch (e) {}

  if (likeBtn) {
    let badge = document.getElementById('cinelove-like-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'cinelove-like-count';
      likeBtn.appendChild(badge);
    }
    badge.textContent = String(likeCount);

    likeBtn.addEventListener('click', () => {
      likeCount += 1;
      badge.textContent = String(likeCount);
      try {
        localStorage.setItem('cl_huy11_likes', String(likeCount));
      } catch (e) {}
      likeBtn.classList.remove('shake');
      void likeBtn.offsetWidth;
      likeBtn.classList.add('shake');
      burstHearts(10);
    });
  }

  const shootHeartBtn = document.getElementById('animation-gift-preview-btn');
  if (shootHeartBtn) {
    shootHeartBtn.addEventListener('click', () => {
      burstHearts(16);
      showGiftBanner('Khách quý', 'Bắn tim', 'assets/biubiu.png');
    });
  }

  const giftBtn = document.getElementById('cinelove-gift-button');
  if (giftBtn) {
    giftBtn.addEventListener('click', () => openModal('gift-modal'));
  }

  const giftItems = document.querySelectorAll('.cl-gift-item');
  let selectedGift = {
    name: 'Bắn tim',
    img: 'assets/biubiu.png'
  };

  giftItems.forEach((item) => {
    item.addEventListener('click', () => {
      giftItems.forEach((el) => el.classList.remove('selected'));
      item.classList.add('selected');
      selectedGift = {
        name: item.getAttribute('data-gift-name') || 'Quà mừng',
        img: item.getAttribute('data-gift-img') || 'assets/biubiu.png'
      };
    });
  });

  const receivedGiftsWrapper = document.querySelector('.received-gifts-wrapper');
  let giftBannerTimer = null;
  function showGiftBanner(sender, giftName, giftImg) {
    if (!receivedGiftsWrapper) return;
    receivedGiftsWrapper.innerHTML = `
      <div class="cl-gift-toast-banner">
        <img src="${escapeHtml(giftImg)}" alt="${escapeHtml(giftName)}" />
        <div><strong>${escapeHtml(sender)}</strong> đã gửi tặng <strong>${escapeHtml(giftName)}</strong> 💖</div>
      </div>
    `;
    clearTimeout(giftBannerTimer);
    giftBannerTimer = setTimeout(() => {
      receivedGiftsWrapper.innerHTML = '';
    }, 4000);
  }

  const giftForm = document.getElementById('gift-form');
  const giftSender = document.getElementById('gift-sender');
  if (giftForm) {
    giftForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const sender = (giftSender.value || 'Khách quý').trim();
      closeModal('gift-modal');
      giftForm.reset();
      showGiftBanner(sender, selectedGift.name, selectedGift.img);
      burstHearts(24);
      showToast(`Cảm ơn ${sender} đã gửi tặng "${selectedGift.name}"! 🎁`);
    });
  }

  const toolbarToggleBtn = document.querySelector('.toolbar-toggle-button');
  const appViewIndex = document.getElementById('app-view-index');
  if (toolbarToggleBtn && appViewIndex) {
    toolbarToggleBtn.addEventListener('click', () => {
      appViewIndex.classList.toggle('hide-toolbar');
    });
  }

  // --- 10. HỘP QUÀ MỪNG (WOBBLING HEART BOX) & COPY STK ---
  const qrBoxNode = document.querySelector('[data-node-id="SVdCdxsNxj"]');
  const qrTextNode = document.querySelector('[data-node-id="Jtt0CMVBFF"]');
  if (qrBoxNode) qrBoxNode.addEventListener('click', () => openModal('qr-box-modal'));
  if (qrTextNode) {
    qrTextNode.style.cursor = 'pointer';
    qrTextNode.addEventListener('click', () => openModal('qr-box-modal'));
  }

  document.addEventListener('click', (e) => {
    const copyAccBtn = e.target.closest('[data-copy-stk]');
    if (copyAccBtn) {
      const stk = copyAccBtn.getAttribute('data-copy-stk');
      if (stk && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(stk).then(() => showToast(`Đã sao chép STK: ${stk} 📋`));
      } else if (stk) {
        showToast(`STK: ${stk}`);
      }
    }
  });

  // --- 11. PHOTO LIGHTBOX (Delegated so dynamic album photos also open in lightbox) ---
  const lightbox = document.getElementById('photo-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  document.addEventListener('click', (e) => {
    const wrap = e.target.closest('.photo-component .photo-bg-wrap');
    if (wrap) {
      const bg = wrap.style.backgroundImage;
      const match = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (match && match[1] && lightbox && lightboxImg) {
        lightboxImg.src = match[1];
        lightbox.classList.add('open');
      }
    }
  });

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === lightboxClose) {
        lightbox.classList.remove('open');
      }
    });
  }

  // --- 12. INTERACTIVE RSVP FORM ("Xác nhận tham dự") ---
  const rsvpContainer = document.querySelector('.rsvp-form-container');
  if (rsvpContainer) {
    const rsvpForm = rsvpContainer.querySelector('form');
    const radioLabels = rsvpContainer.querySelectorAll('.guest-ui_radioWrapper__Q5snP');
    const radioInputs = rsvpContainer.querySelectorAll('input[name="rsvp-attendance"]');
    const attendeeSelect = document.getElementById('rsvp-attendee-count');
    const attendeeGroup = attendeeSelect ? attendeeSelect.parentElement : null;

    radioInputs.forEach((input) => {
      input.addEventListener('change', () => {
        radioLabels.forEach((lbl) => lbl.classList.remove('guest-ui_radioChecked__lVRVz'));
        const parentLabel = input.closest('.guest-ui_radioWrapper__Q5snP');
        if (parentLabel) parentLabel.classList.add('guest-ui_radioChecked__lVRVz');
        if (attendeeGroup) {
          attendeeGroup.style.opacity = input.value === 'yes' ? '1' : '0.45';
          attendeeSelect.disabled = input.value !== 'yes';
        }
      });
    });

    if (rsvpForm) {
      rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = rsvpForm.querySelector('input[name="rsvp-name"]');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          showToast('Vui lòng nhập họ và tên của bạn! ✍️');
          if (nameInput) nameInput.focus();
          return;
        }
        const checkedRadio = rsvpForm.querySelector('input[name="rsvp-attendance"]:checked');
        const attending = checkedRadio ? checkedRadio.value === 'yes' : true;
        const count = attendeeSelect ? attendeeSelect.value : '1';

        try {
          const list = JSON.parse(localStorage.getItem('cl_huy11_rsvp') || '[]');
          list.push({ name, attending, count, submittedAt: new Date().toISOString() });
          localStorage.setItem('cl_huy11_rsvp', JSON.stringify(list));
        } catch (err) {}

        burstHearts(20);
        if (attending) {
          showToast(`Cảm ơn ${name}! Đã xác nhận tham dự (${count} người) 🎉`);
        } else {
          showToast(`Cảm ơn ${name} đã phản hồi lời mời! 💕`);
        }
        rsvpForm.reset();
        radioLabels.forEach((lbl, i) => {
          lbl.classList.toggle('guest-ui_radioChecked__lVRVz', i === 0);
        });
        if (attendeeGroup && attendeeSelect) {
          attendeeGroup.style.opacity = '1';
          attendeeSelect.disabled = false;
        }
      });
    }
  }

  // --- 13. DYNAMIC BRIDE VENUE/MAP/CALENDAR, ALBUM EXPANSION & BANK STK RENDERING ---
  function recalculateCanvasLayout() {
    originalNodeTops.forEach((origTop, el) => {
      if (origTop >= BELOW_ALBUM_THRESHOLD) {
        el.style.top = `${origTop + currentBrideOffset + currentAlbumDeltaY}px`;
      } else if (origTop >= BRIDE_SECTION_THRESHOLD) {
        el.style.top = `${origTop + currentBrideOffset}px`;
      }
    });

    document.querySelectorAll('.cl-extra-album-node').forEach((el) => {
      const baseTop = parseFloat(el.getAttribute('data-base-top') || '0');
      if (baseTop) {
        el.style.top = `${baseTop + currentBrideOffset}px`;
      }
    });

    CONFIG.baseHeight = Math.max(4800, BASE_ORIGINAL_HEIGHT + currentBrideOffset + currentAlbumDeltaY);
    updateCardScale();
  }

  // Groom "Xem chỉ đường" click action
  const groomDirBtn = document.querySelector('[data-node-id="mRpkzdjCdN"]');
  if (groomDirBtn) {
    groomDirBtn.addEventListener('click', () => {
      const q = encodeURIComponent(currentGroomMapAddress || 'Du Tràng, Đông Cứu, Bắc Ninh');
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
    });
  }

  function renderBrideVenueSection(brideCfg) {
    const b = Object.assign({}, DEFAULT_BRIDE_SECTION, brideCfg || {});
    const canvasInner = document.querySelector('#canvas-scaler > div');
    if (!canvasInner) return;

    let sectionEl = document.getElementById('cl-bride-venue-section');

    if (b.enabled === false) {
      if (sectionEl) sectionEl.style.display = 'none';
      currentBrideOffset = 0;
      recalculateCanvasLayout();
      return;
    }

    currentBrideOffset = BRIDE_SECTION_HEIGHT;

    if (!sectionEl) {
      sectionEl = document.createElement('div');
      sectionEl.id = 'cl-bride-venue-section';
      sectionEl.style.cssText = 'position:absolute;top:3625px;left:0px;width:404px;height:1065px;z-index:36;pointer-events:auto';
      canvasInner.appendChild(sectionEl);
    }
    sectionEl.style.display = 'block';

    const encodedMap = encodeURIComponent(b.mapAddress || b.venueAddress || 'Bắc Ninh');
    const mapEmbedSrc = `https://maps.google.com/maps?q=${encodedMap}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    const mapDirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodedMap}`;

    sectionEl.innerHTML = `
      <!-- Divider heart character -->
      <div style="position:absolute;top:0px;left:174.2px;width:55.59px;height:72.4px;z-index:27" class="jsx-6b79f838dbcd3756">
        <div class="jsx-6b79f838dbcd3756 material-component" style="width:100%;height:100%">
          <div style="background-image:url(assets/char-couple-heart.png);width:100%;height:100%;background-size:cover;background-position:center" class="jsx-6b79f838dbcd3756 photo-bg-wrap"></div>
        </div>
      </div>

      <!-- Tiêu đề Lễ Nhà Gái -->
      <div style="position:absolute;top:84px;left:18.73px;width:366.5px;text-align:center;color:#000000;font-size:20.2px;font-weight:bold;font-family:'Quicksand',sans-serif;line-height:1.6;text-transform:uppercase">
        ${escapeHtml(b.partyTitle)}
      </div>
      <div style="position:absolute;top:126px;left:23.17px;width:357.94px;text-align:center;color:#000000;font-size:12.12px;font-weight:bold;font-family:'Quicksand',sans-serif;line-height:1.79;text-transform:uppercase">
        ${escapeHtml(b.partySub)}
      </div>

      <!-- Giờ / Thứ / Ngày lớn / Tháng / Năm / Âm lịch Nhà Gái -->
      <div style="position:absolute;top:176px;left:8.11px;width:146.25px;text-align:center;color:#000000;font-size:21px;font-family:'Quicksand',sans-serif;letter-spacing:4px">
        ${escapeHtml(b.time)}
      </div>
      <div style="position:absolute;top:208px;left:8.11px;width:146.25px;text-align:center;color:#000000;font-size:21px;font-family:'Quicksand',sans-serif">
        ${escapeHtml(b.dayOfWeek)}
      </div>
      <div style="position:absolute;top:170px;left:143.06px;width:108.11px;display:flex;align-items:center;justify-content:center;border-left:2px solid #4a4a4a;border-right:2px solid #4a4a4a;animation:animation-pulse 2s infinite ease-in-out">
        <div style="color:#631717;font-size:62.22px;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;line-height:normal;letter-spacing:3px">
          ${escapeHtml(b.day)}
        </div>
      </div>
      <div style="position:absolute;top:176px;left:247.96px;width:146.25px;text-align:center;color:#000000;font-size:21px;font-family:'Quicksand',sans-serif">
        ${escapeHtml(b.month)}
      </div>
      <div style="position:absolute;top:208px;left:247.96px;width:146.25px;text-align:center;color:#000000;font-size:21px;font-family:'Quicksand',sans-serif">
        ${escapeHtml(b.year)}
      </div>
      <div style="position:absolute;top:256px;left:14.42px;width:375.48px;text-align:center;color:#000000;font-size:14.54px;font-family:'Quicksand',sans-serif">
        ${escapeHtml(b.lunarDate)}
      </div>

      <!-- Khung Địa điểm tổ chức Tư Gia Nhà Gái -->
      <div style="position:absolute;top:306px;left:92px;width:220px;text-align:center;color:#000000;font-size:29.09px;font-family:'HoaTay1',cursive">
        ${escapeHtml(b.venueHeader)}
      </div>
      <div style="position:absolute;top:352px;left:10.65px;width:125.72px;height:94.91px;z-index:30" class="jsx-8714137441931921">
        <div class="jsx-8714137441931921 photo-component" style="width:100%;height:100%">
          <div style="background-image:url(assets/venue-floral.png);width:100%;height:100%;background-size:cover;background-position:center" class="jsx-8714137441931921 photo-bg-wrap"></div>
        </div>
      </div>
      <div style="position:absolute;top:358px;left:82.8px;width:265px;text-align:center;color:#000000;font-size:20px;font-weight:bold;font-family:'Chetta Vissto',serif;line-height:1.79;text-transform:uppercase;z-index:31">
        ${escapeHtml(b.venueName)}
      </div>
      <div style="position:absolute;top:402px;left:116.59px;width:276px;text-align:left;color:#000000;font-size:12.93px;font-family:'Quicksand',sans-serif;font-style:italic;z-index:32">
        ${escapeHtml(b.venueAddress)}
      </div>

      <!-- Nút Xem chỉ đường Nhà Gái -->
      <a href="${escapeHtml(mapDirectUrl)}" target="_blank" rel="noopener" style="position:absolute;top:466px;left:46.69px;width:136px;padding:3px 10px;border-radius:30px;box-shadow:0px 0px 10px 0px rgba(0,0,0,0.45);background-color:#ffffff;display:flex;align-items:center;justify-content:center;color:#000000;font-size:11.31px;font-family:'Chetta Vissto',serif;line-height:1.79;text-transform:uppercase;text-decoration:none;z-index:33;cursor:pointer">
        Xem chỉ đường
      </a>

      <!-- Google Maps Nhà Gái -->
      <div style="position:absolute;top:498px;left:47px;width:310.6px;height:157.73px;z-index:34">
        <div style="width:100%;height:100%" class="jsx-bfb82be43f3e5a5f simple-map-container">
          <iframe width="100%" height="100%" frameBorder="0" style="border:0;border-radius:0px" src="${escapeHtml(mapEmbedSrc)}" allowFullScreen="" class="jsx-bfb82be43f3e5a5f"></iframe>
        </div>
      </div>

      <!-- Save the Date + Lịch Nhà Gái Riêng -->
      <div style="position:absolute;top:674px;left:96.58px;width:197.64px;height:70.47px;z-index:35" class="jsx-8714137441931921">
        <div class="jsx-8714137441931921 photo-component" style="width:100%;height:100%">
          <div style="background-image:url(assets/save-the-date.png);width:100%;height:100%;background-size:cover;background-position:center" class="jsx-8714137441931921 photo-bg-wrap"></div>
        </div>
      </div>
      <div id="cl-bride-calendar" style="position:absolute;top:724px;left:20.88px;width:365.3px;height:337.92px;z-index:34">
        <div class="calendar componentBOX" style="opacity:1;z-index:154;border-radius:0;width:100%;height:100%;color:#000000;font-size:11.312px;font-family:Arial">
          <div class="template-one">
            <div class="one-back"></div>
            <div class="one-head" style="background-color:#e9d1d8">10.2026</div>
            <div class="one-body"></div>
          </div>
        </div>
      </div>
    `;

    renderCalendarWidget(b.calendarDate || '2026-10-03', '#cl-bride-calendar .template-one');
    recalculateCanvasLayout();
  }

  function normalizeAssetUrl(url) {
    if (!url || typeof url !== 'string') return '';
    let s = url.trim();
    if (s.includes('1794322198097-vgjikg.jpg')) {
      s = 'uploads/1794324127512-x21ut2.jpg';
    }
    if (s.startsWith('/uploads/')) {
      s = s.slice(1);
    }
    return s;
  }

  function renderDynamicAlbum(albumList) {
    if (!Array.isArray(albumList) || albumList.length === 0) return;

    const canvasInner = document.querySelector('#canvas-scaler > div');
    if (!canvasInner) return;

    // Remove previously injected dynamic album nodes
    canvasInner.querySelectorAll('.cl-extra-album-node').forEach((el) => el.remove());

    // Update the first 6 built-in album nodes (or hide if fewer than 6)
    for (let i = 0; i < ALBUM_BASE_IDS.length; i++) {
      const nodeEl = document.querySelector(`[data-node-id="${ALBUM_BASE_IDS[i]}"]`);
      if (!nodeEl) continue;
      if (i < albumList.length && albumList[i]) {
        const resolvedUrl = normalizeAssetUrl(albumList[i]);
        nodeEl.style.display = '';
        const bgWrap = nodeEl.querySelector('.photo-bg-wrap');
        if (bgWrap) bgWrap.style.backgroundImage = `url("${resolvedUrl}")`;
      } else {
        nodeEl.style.display = 'none';
      }
    }

    // Create extra album nodes for index >= 6
    for (let i = 6; i < albumList.length; i++) {
      const imgUrl = normalizeAssetUrl(albumList[i]);
      if (!imgUrl) continue;
      const row = Math.floor(i / 2);
      const col = i % 2;
      const baseTopPx = ALBUM_START_TOP + row * ALBUM_ROW_STEP;
      const topPx = baseTopPx + currentBrideOffset;
      const leftPx = col === 0 ? 12.72 : 203.5;

      const extraDiv = document.createElement('div');
      extraDiv.className = 'jsx-8714137441931921 cl-extra-album-node';
      extraDiv.setAttribute('data-base-top', String(baseTopPx));
      extraDiv.style.cssText = `position:absolute;top:${topPx}px;left:${leftPx}px;width:182.2px;height:285px;z-index:48;cursor:default;transform:rotate(0deg) scale(1, 1)`;
      extraDiv.innerHTML = `
        <div style="width:100%;height:100%;opacity:1;transform:none">
          <div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:0px solid;padding:0px;background-color:transparent;opacity:1;border-radius:0px;box-shadow:none" class="jsx-8714137441931921">
            <div style="mask-image:none;mask-size:100% 100%;mask-repeat:no-repeat" class="jsx-8714137441931921 photo-component">
              <div style="background-image:url(&quot;${escapeHtml(imgUrl)}&quot;);border-radius:0px" class="jsx-8714137441931921 photo-bg-wrap"></div>
            </div>
          </div>
        </div>
      `;
      canvasInner.appendChild(extraDiv);
    }

    // Calculate vertical delta for elements below the album (original 3 rows = 6 photos)
    const totalRows = Math.max(1, Math.ceil(albumList.length / 2));
    currentAlbumDeltaY = (totalRows - 3) * ALBUM_ROW_STEP;
    recalculateCanvasLayout();
  }

  // Render default Bride section on startup so Tư gia nhà gái, Maps nhà gái & Lịch nhà gái riêng are visible immediately
  renderBrideVenueSection(DEFAULT_BRIDE_SECTION);

  function renderBankAccountsModal(accounts) {
    const qrModal = document.getElementById('qr-box-modal');
    if (!qrModal || !Array.isArray(accounts) || accounts.length === 0) return;

    const cardBody = qrModal.querySelector('.cl-modal-card');
    if (!cardBody) return;

    const cols = accounts.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(165px, 1fr))';
    const itemsHtml = accounts
      .map((acc) => {
        const title = escapeHtml(acc.title || 'Mừng cưới');
        const bankName = escapeHtml(acc.bankName || '');
        const accNumber = escapeHtml(acc.accountNumber || '');
        const accHolder = escapeHtml(acc.accountHolder || '');
        const branch = escapeHtml(acc.branch || '');
        const qrUrl =
          acc.qrUrl ||
          (acc.bankCode && acc.accountNumber
            ? `https://img.vietqr.io/image/${encodeURIComponent(acc.bankCode)}-${encodeURIComponent(acc.accountNumber)}-compact2.png?accountName=${encodeURIComponent(acc.accountHolder || '')}`
            : 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(acc.accountNumber || title));

        return `
          <div style="border:1px solid #ebebed;border-radius:14px;padding:12px 10px;background:#fff9fa;display:flex;flex-direction:column;align-items:center;text-align:center">
            <div style="font-weight:700;font-size:13px;color:#631717;margin-bottom:4px">${title}</div>
            ${bankName ? `<div style="font-size:11.5px;font-weight:600;color:#e8436a;margin-bottom:6px">${bankName}</div>` : ''}
            <img src="${escapeHtml(qrUrl)}" alt="${title}" style="width:130px;height:130px;object-fit:contain;border-radius:8px;border:1px solid #eee;background:#fff;padding:4px" />
            ${accHolder ? `<div style="font-size:12px;font-weight:700;color:#161823;margin-top:8px">${accHolder}</div>` : ''}
            ${accNumber ? `<div style="font-size:12.5px;font-weight:600;color:#333;margin-top:2px;letter-spacing:0.3px">STK: ${accNumber}</div>` : ''}
            ${branch ? `<div style="font-size:11px;color:#666;margin-top:2px">${branch}</div>` : ''}
            ${
              accNumber
                ? `<button type="button" data-copy-stk="${accNumber}" style="margin-top:8px;padding:5px 12px;border-radius:14px;border:1px solid rgba(232,67,106,0.3);background:#fff;color:#e8436a;font-size:11.5px;font-weight:600;cursor:pointer">📋 Sao chép STK</button>`
                : ''
            }
          </div>
        `;
      })
      .join('');

    cardBody.innerHTML = `
      <div class="cl-modal-header">
        <h3 id="qr-box-modal-title" class="cl-modal-title">💝 Hộp Quà Yêu Thương</h3>
        <button type="button" class="cl-modal-close" data-close-modal="qr-box-modal" aria-label="Đóng">✕</button>
      </div>
      <p style="font-size:13px;color:#555;line-height:1.5;margin:0 0 14px">
        Cảm ơn tình cảm yêu thương của quý khách dành cho gia đình chúng tôi!
      </p>
      <div style="display:grid;grid-template-columns:${cols};gap:12px;margin-bottom:16px">
        ${itemsHtml}
      </div>
      <button type="button" class="cl-btn-primary" data-close-modal="qr-box-modal">Đóng</button>
    `;

    cardBody.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
    });
  }

  // --- 14. DYNAMIC ADMIN CONFIGURATION ENGINE ---
  function applyCustomConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;

    // 14.1 General settings
    if (cfg.general) {
      const g = cfg.general;
      if (g.pageTitle) {
        document.title = `${g.pageTitle} | Thiệp Cưới Online`;
        const sideTitle = document.querySelector('.feedLayout_infoTitle__srkTO');
        if (sideTitle) sideTitle.textContent = g.pageTitle;
      }
      if (g.pageDesc) {
        const sideDesc = document.querySelector('.feedLayout_infoDesc__WayYb');
        if (sideDesc) sideDesc.textContent = g.pageDesc;
      }
      if (g.coverThumb) {
        const resolvedThumb = normalizeAssetUrl(g.coverThumb);
        const sideCover = document.querySelector('.feedLayout_infoCover__g9FMQ');
        const railAvatar = document.querySelector('.feedLayout_railAvatar__51VhB');
        const pillThumb = document.querySelector('.toolbar-toggle-button .thumbnail');
        if (sideCover) sideCover.src = resolvedThumb;
        if (railAvatar) railAvatar.src = resolvedThumb;
        if (pillThumb) pillThumb.src = resolvedThumb;
      }
      if (g.musicUrl && audioEl) {
        const resolvedMusic = normalizeAssetUrl(g.musicUrl);
        if (audioEl.getAttribute('src') !== resolvedMusic) {
          const wasPlaying = !audioEl.paused;
          audioEl.src = resolvedMusic;
          if (wasPlaying) audioEl.play().catch(() => {});
        }
      }
      if (typeof g.autoScrollEnabled === 'boolean') {
        CONFIG.autoScrollEnabled = g.autoScrollEnabled;
      }
      if (typeof g.autoScrollSpeed === 'number' && !Number.isNaN(g.autoScrollSpeed)) {
        CONFIG.autoScrollSpeed = g.autoScrollSpeed;
      }
    }

    // 14.2 Text nodes
    if (cfg.texts && typeof cfg.texts === 'object') {
      for (const [nodeId, htmlVal] of Object.entries(cfg.texts)) {
        if (htmlVal === undefined || htmlVal === null) continue;
        const container = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (container) {
          const textDiv = container.querySelector('[contenteditable]');
          if (textDiv) {
            textDiv.innerHTML = htmlVal;
          }
        }
      }
    }

    // 14.3 Photo nodes
    if (cfg.photos && typeof cfg.photos === 'object') {
      for (const [nodeId, imgUrl] of Object.entries(cfg.photos)) {
        const resolvedImg = normalizeAssetUrl(imgUrl);
        if (!resolvedImg) continue;
        const container = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (container) {
          const transEl = container.querySelector('[data-transition-key]');
          if (transEl) {
            transEl.style.opacity = '1';
            transEl.style.transform = 'none';
          }
          const bgWrap = container.querySelector('.photo-bg-wrap');
          if (bgWrap) {
            bgWrap.style.backgroundImage = `url("${resolvedImg}")`;
          }
        }
      }
    }

    // 14.4 Dynamic Album Photos (supports adding unlimited photos!)
    if (Array.isArray(cfg.albumPhotos) && cfg.albumPhotos.length > 0) {
      renderDynamicAlbum(cfg.albumPhotos);
    }

    // 14.5 Map address (Nhà Trai)
    if (cfg.map && cfg.map.address) {
      currentGroomMapAddress = cfg.map.address;
      const mapIframe = document.querySelector('[data-node-id="a1MdpL4nom"] iframe');
      if (mapIframe) {
        const encoded = encodeURIComponent(cfg.map.address);
        const newSrc = `https://maps.google.com/maps?q=${encoded}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        if (mapIframe.getAttribute('src') !== newSrc) {
          mapIframe.src = newSrc;
        }
      }
    }

    // 14.5b Bride Venue, Bride Google Maps & Bride Separate Calendar
    if (cfg.brideSection && typeof cfg.brideSection === 'object') {
      renderBrideVenueSection(cfg.brideSection);
    }

    // 14.6 Calendar & Countdown Date/Time (Nhà Trai)
    if (cfg.calendar) {
      const cDate = cfg.calendar.selectedDate || '2026-10-04';
      const cTime = cfg.calendar.selectedTime || '12:30';
      renderCalendarWidget(cDate);
      CONFIG.weddingDate = `${cDate}T${cTime}:00+07:00`;
      updateCountdown();
    }

    // 14.7 Bank Accounts (Multi-STK & VietQR)
    if (Array.isArray(cfg.bankAccounts) && cfg.bankAccounts.length > 0) {
      renderBankAccountsModal(cfg.bankAccounts);
    }
  }

  // Load config on startup:
  // 1) Instant paint from localStorage (if edited locally in browser)
  // 2) Fetch ./site-config.json (works on GitHub Pages & static hosts!) or /api/config (local Node server)
  // Clear legacy localStorage key that could hold broken '/uploads/...' paths on mobile browsers
  try {
    localStorage.removeItem('cl_huy11_custom_config');
    if (isLocalHost || isPreviewIframe) {
      const localCfg = localStorage.getItem('cl_vinhhoang_config_v4');
      if (localCfg) {
        applyCustomConfig(JSON.parse(sanitizeLegacyNames(localCfg)));
      }
    }
  } catch (e) {}

  async function loadRemoteConfig() {
    for (const url of [`./site-config.json?t=${Date.now()}`, '/api/config']) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const cfg = await res.json();
          if (cfg && Object.keys(cfg).length > 0) {
            applyCustomConfig(cfg);
            if (isLocalHost || isPreviewIframe) {
              try {
                localStorage.setItem('cl_vinhhoang_config_v4', JSON.stringify(cfg));
              } catch (e) {}
            }
            return;
          }
        }
      } catch (e) {}
    }
  }
  loadRemoteConfig();

  // Live preview updates from Admin Dashboard
  window.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'CL_APPLY_CONFIG') {
      applyCustomConfig(event.data.config);
    } else if (event.data.type === 'CL_SCROLL_TO') {
      if (scrollRoot && typeof event.data.top === 'number') {
        pauseAutoScrollTemporarily(10000);
        const scale = (cardEl ? cardEl.clientWidth : 404) / CONFIG.baseWidth;
        scrollRoot.scrollTo({ top: Math.max(0, event.data.top * scale - 60), behavior: 'smooth' });
      }
    } else if (event.data.type === 'CL_RELOAD_WISHES') {
      loadWishesFromStorage();
      renderRightPanel();
      renderBlessingBox();
    } else if (event.data.type === 'CL_OPEN_MODAL') {
      if (event.data.modalId) openModal(event.data.modalId);
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'cl_huy11_custom_config' && event.newValue) {
      try {
        applyCustomConfig(JSON.parse(event.newValue));
      } catch (e) {}
    } else if (event.key === 'cl_huy11_wishes') {
      loadWishesFromStorage();
      renderRightPanel();
      renderBlessingBox();
    }
  });
})();
