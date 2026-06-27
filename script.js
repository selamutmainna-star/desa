/* ===================================================================
   DESA RUHUI RAHAYU - SCRIPT JAVASCRIPT UTAMA
   Berisi seluruh logika interaktif: preloader, navbar, scroll reveal,
   counter statistik, dark mode, search, back to top, dll.
   =================================================================== */

// Menunggu seluruh DOM siap sebelum menjalankan script
document.addEventListener('DOMContentLoaded', function () {

  /* =================================================================
     1. PRELOADER
     Menyembunyikan preloader otomatis setelah halaman selesai dimuat
     ================================================================= */
  const preloader = document.getElementById('preloader');

  window.addEventListener('load', function () {
    // Beri sedikit delay agar animasi preloader terlihat halus
    setTimeout(function () {
      preloader.classList.add('hidden');
    }, 600);
  });

  // Fallback: jika event 'load' lambat, tetap sembunyikan setelah 3 detik
  setTimeout(function () {
    preloader.classList.add('hidden');
  }, 3000);


  /* =================================================================
     2. SCROLL PROGRESS BAR
     Mengisi bar di bagian atas halaman sesuai posisi scroll
     ================================================================= */
  const scrollProgressBar = document.getElementById('scrollProgressBar');

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgressBar.style.width = scrollPercent + '%';
  }


  /* =================================================================
     3. NAVBAR: efek scroll (berubah warna) + active menu indicator
     ================================================================= */
  const navbar = document.getElementById('navbar');
  // Include all anchors inside the main nav so dropdown items are handled too
  const navLinks = document.querySelectorAll('.nav-menu a');
  const sections = document.querySelectorAll('section[id]');

  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Update active menu berdasarkan section yang aktif
  // Catatan: warna background navbar dikembalikan seperti semula,
  // jadi hanya link nav yang di-highlight.
  function applyActiveSection(currentSectionId) {
    const safeSectionId = currentSectionId || 'beranda';

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      const href = link.getAttribute('href') || '';
      if (href === ('#' + safeSectionId)) {
        link.classList.add('active');
      }
    });
  }


  // IntersectionObserver untuk menentukan section aktif saat scroll
  // (lebih presisi dan stabil dibanding perhitungan offsetTop)
  let activeSectionId = 'beranda';

  const sectionObserver = new IntersectionObserver(
    function (entries) {
      // ambil entry yang paling banyak terlihat
      // agar saat overlap tetap konsisten
      const visible = entries
        .filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return (b.intersectionRatio || 0) - (a.intersectionRatio || 0); });

      if (visible.length) {
        const id = visible[0].target.getAttribute('id');
        if (id && id !== activeSectionId) {
          activeSectionId = id;
          applyActiveSection(activeSectionId);
        }
      }
    },
    {
      // garis tengah viewport (sekitar header) jadi patokan aktif
      root: null,
      rootMargin: '-25% 0px -65% 0px',
      threshold: [0, 0.15, 0.35, 0.55, 0.75]
    }
  );

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  // set initial state sesuai posisi awal halaman
  (function initActiveByViewport() {

    // fallback cepat tanpa perhitungan berat
    const initialId = (function () {
      let best = 'beranda';
      let bestRatio = -1;
      const vhTop = 0;
      const vhBottom = window.innerHeight;
      sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        const intersection = Math.max(0, Math.min(rect.bottom, vhBottom) - Math.max(rect.top, vhTop));
        const ratio = vhBottom > 0 ? (intersection / vhBottom) : 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = section.getAttribute('id') || 'beranda';
        }
      });
      return best;
    })();

    activeSectionId = initialId;
    applyActiveSection(activeSectionId);
  })();



  /* =================================================================
     4. BACK TO TOP BUTTON
     Muncul saat scroll ke bawah, klik untuk kembali ke atas
     ================================================================= */
  const backToTop = document.getElementById('backToTop');

  function handleBackToTopVisibility() {
    if (window.scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  /* =================================================================
     5. GABUNGAN SEMUA EVENT SCROLL (untuk performa lebih baik)
     ================================================================= */
  function onScroll() {
    updateScrollProgress();
    handleNavbarScroll();
    // setActiveMenu digantikan oleh IntersectionObserver
    handleBackToTopVisibility();
    handleParallax();
    revealOnScroll();
  }


  window.addEventListener('scroll', onScroll);
  // Catatan: onScroll() pertama kali dipanggil di akhir file (lihat bagian 15),
  // setelah seluruh variabel (termasuk heroBg) selesai dideklarasikan.


  /* =================================================================
     6. SMOOTH SCROLLING UNTUK SEMUA LINK NAVIGASI INTERNAL
     ================================================================= */
  // Intercept link internal (#section) hanya untuk href berupa #id.
  // Jangan ganggu link eksternal yang juga masih mengawali href="#".
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const offsetTop = targetEl.offsetTop - 80; // Kompensasi tinggi navbar
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });

        // Tutup menu mobile jika sedang terbuka
        closeMobileMenu();
      }
    });
  });

  /* =================================================================
     6B. MEDIA SOSIAL + KONTAK (pakai data-link- di index.html)
     Mengubah href dari placeholder '#' menjadi link nyata.
     ================================================================= */
  function sanitizeWhatsAppNumber(raw) {
    return String(raw || '').replace(/[^\d]/g, '');
  }

  function buildLinkFromData(el) {
    const type = (el.getAttribute('data-link-type') || '').toLowerCase();
    const value = (el.getAttribute('data-link') || '').trim();
    if (!value) return null;

    if (type === 'mailto') {
      // value berupa email
      return 'mailto:' + value;
    }

    if (type === 'wa') {
      // value berupa nomor (boleh ada +62, spasi, tanda -) atau link wa.me
      // Jika value sudah berupa url, biarkan.
      if (/^https?:\/\//i.test(value)) return value;
      const digits = sanitizeWhatsAppNumber(value);
      if (!digits) return null;
      return 'https://wa.me/' + digits;
    }

    // default: dianggap url
    return value;
  }

  // Kartu media sosial (YouTube/Instagram/Facebook/TikTok)
  ['youtube', 'instagram', 'facebook', 'tiktok'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const link = buildLinkFromData(el);
    if (link) el.setAttribute('href', link);
  });

  // Email
  const emailLink = document.querySelector('.email-link');
  if (emailLink) {
    const link = buildLinkFromData(emailLink);
    if (link) emailLink.setAttribute('href', link);
  }

  // Footer social links
  ['footer-facebook', 'footer-instagram', 'footer-tiktok', 'footer-youtube'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const link = buildLinkFromData(el);
    if (link) {
      el.setAttribute('href', link);
    } else {
      // jika kosong, jangan navigasi
      el.removeAttribute('href');
    }
  });


  /* =================================================================
     7. HAMBURGER MENU (RESPONSIVE MOBILE)
     ================================================================= */
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');

  // Remove nav links that point to non-existing sections to avoid dead links
  function cleanBrokenNavLinks() {
    if (!navMenu) return;
    const links = Array.from(navMenu.querySelectorAll('a[href^="#"]'));
    links.forEach(function (link) {
      const href = (link.getAttribute('href') || '').trim();
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) {
        // remove the link
        const parentMenu = link.closest('.dropdown-menu');
        link.remove();
        // if dropdown-menu becomes empty, remove the whole dropdown wrapper
        if (parentMenu && parentMenu.querySelectorAll('a').length === 0) {
          const dropdownWrapper = parentMenu.closest('.nav-dropdown');
          if (dropdownWrapper) dropdownWrapper.remove();
        }
      }
    });
  }

  cleanBrokenNavLinks();

  // Forward clicks from the mini hamburger (mobile-only visual) to the main hamburger
  const miniHamburger = document.getElementById('miniHamburger');
  if (miniHamburger && hamburger) {
    miniHamburger.addEventListener('click', function () {
      hamburger.click();
    });
  }

  // Membuat elemen backdrop untuk menu mobile secara dinamis
  const menuBackdrop = document.createElement('div');
  menuBackdrop.classList.add('menu-backdrop');
  document.body.appendChild(menuBackdrop);

  function openMobileMenu() {
    navMenu.classList.add('mobile-active');
    hamburger.classList.add('active');
    menuBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    navMenu.classList.remove('mobile-active');
    hamburger.classList.remove('active');
    menuBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    if (navMenu.classList.contains('mobile-active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  menuBackdrop.addEventListener('click', closeMobileMenu);


  /* =================================================================
     8. DARK MODE TOGGLE
     Menyimpan preferensi tema menggunakan variabel JS (tanpa localStorage
     karena keterbatasan environment artifact/offline tertentu)
     ================================================================= */
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle.querySelector('i');

  // Cek preferensi sistem operasi pengguna sebagai default awal
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.body.classList.add('dark-mode');
    themeIcon.classList.remove('fa-moon');
    themeIcon.classList.add('fa-sun');
  }

  themeToggle.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    if (isDark) {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    } else {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  });


  // Search feature removed per user request (small header logo + search box)


  /* =================================================================
     10. NORMALISASI GRAFIK DEMOGRAFI
     Panjang bar dihitung dari angka yang tampil, tanpa mengubah data.
     ================================================================= */
  function parseDisplayedNumber(text) {
    const numericText = text.replace(/[^\d]/g, '');
    return numericText ? parseInt(numericText, 10) : 0;
  }

  function normalizeHorizontalCharts() {
    document.querySelectorAll('.bar-chart').forEach(function (chart) {
      const rows = Array.from(chart.querySelectorAll('.bar-row'));
      // Extract numeric values from each row (prefer <strong> content)
      const values = rows.map(function (row) {
        const valueEl = row.querySelector('strong');
        const fallback = row.getAttribute('data-value') || '';
        const raw = valueEl ? valueEl.textContent : fallback;
        return valueEl || fallback ? parseDisplayedNumber(String(raw)) : 0;
      });

      const maxValue = values.length ? Math.max.apply(null, values) : 0;

      // Set --bar for each row as percentage of the max value
      rows.forEach(function (row, index) {
        const val = values[index] || 0;
        const percent = maxValue > 0 ? (val / maxValue) * 100 : 0;
        // Ensure a minimal visible width for non-zero values
        // Allow much smaller visible bars when data max is large so small values remain
        // visually distinct (e.g., 2033 vs 40 vs 7). Use a smaller minimum when maxValue is large.
        const minVisible = maxValue > 500 ? 0.6 : 3; // percent
        const displayPercent = val > 0 && percent < minVisible ? minVisible : percent;
        row.style.setProperty('--bar', displayPercent.toFixed(2) + '%');
      });
    });
    // After setting widths, also update percentage labels relative to the chart total
    document.querySelectorAll('.bar-chart').forEach(function (chart) {
      const rows = Array.from(chart.querySelectorAll('.bar-row'));
      const values = rows.map(function (row) {
        const valueEl = row.querySelector('strong');
        return valueEl ? parseDisplayedNumber(valueEl.textContent) : 0;
      });
      const total = values.reduce(function (a, b) { return a + b; }, 0);

      rows.forEach(function (row, index) {
        const val = values[index] || 0;
        const pct = total > 0 ? (val / total) * 100 : 0;
        let pctEl = row.querySelector('.bar-percent');
        if (!pctEl) {
          pctEl = document.createElement('span');
          pctEl.className = 'bar-percent';
          const strong = row.querySelector('strong');
          if (strong) strong.insertAdjacentElement('afterend', pctEl);
        }
        pctEl.textContent = total > 0 ? ' (' + pct.toFixed(1) + '%)' : '';
      });
    });
  }


  function normalizeRtChart() {
    document.querySelectorAll('.mini-bars').forEach(function (chart) {
      const panel = chart.closest('.data-panel');
      if (!panel) return;

      const tableRows = Array.from(panel.querySelectorAll('.data-table tbody tr'));
      const bars = Array.from(chart.querySelectorAll('span'));
      const values = tableRows.map(function (row) {
        const cells = row.querySelectorAll('td');
        return cells.length > 1 ? parseDisplayedNumber(cells[1].textContent) : 0;
      });
      const maxValue = Math.max.apply(null, values);

      // Choose a smaller minimal visible percentage when the chart's max is large
      const minVisible = maxValue > 500 ? 0.8 : 8; // percent

      bars.forEach(function (bar, index) {
        const value = values[index] || 0;
        const labelCell = tableRows[index] ? tableRows[index].querySelector('td') : null;
        const label = labelCell ? labelCell.textContent.trim() : (bar.getAttribute('data-label') || 'RT');
        const rawPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const percent = maxValue > 0 ? (value > 0 && rawPct < minVisible ? minVisible : rawPct) : 0;
        bar.style.setProperty('--bar', percent.toFixed(2) + '%');
        bar.setAttribute('data-label', label);
        bar.setAttribute('data-value', value);
        bar.setAttribute('title', label + ': ' + value + '');
      });
    });
  }

  normalizeHorizontalCharts();
  normalizeRtChart();

  // Initialize interactive chart tooltips (delegated)
  (function initChartTooltips() {
    let tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    document.body.appendChild(tooltip);

    function showTooltip(html, x, y) {
      tooltip.innerHTML = html;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
      tooltip.classList.add('visible');
    }
    function hideTooltip() {
      tooltip.classList.remove('visible');
    }

    document.addEventListener('mousemove', function (e) {
      // Position tooltip while visible
      if (tooltip.classList.contains('visible')) {
        tooltip.style.left = (e.clientX + 12) + 'px';
        tooltip.style.top = (e.clientY - 12) + 'px';
      }
    });

    document.addEventListener('mouseover', function (e) {
      const target = e.target;
      // bar-row filled element
      if (target.matches('.bar-row b')) {
        const row = target.closest('.bar-row');
        const label = row.querySelector('span') ? row.querySelector('span').textContent.trim() : '';
        const valueEl = row.querySelector('strong');
        const value = valueEl ? parseDisplayedNumber(valueEl.textContent) : 0;
        // percent read from appended percent label if exists
        const pctText = row.querySelector('.bar-percent') ? row.querySelector('.bar-percent').textContent.replace(/[()]/g,'') : '';
        showTooltip('<strong>' + label + '</strong><div>' + value + ' ' + pctText + '</div>', e.clientX + 12, e.clientY - 12);
        return;
      }

      // mini-bars vertical columns
      if (target.matches('.mini-bars span')) {
        const bar = target;
        const value = parseDisplayedNumber(bar.getAttribute('data-value') || '0');
        const label = bar.getAttribute('data-label') || '';
        // compute percent relative to max of that chart
        const chart = bar.closest('.mini-bars');
        const panel = chart ? chart.closest('.data-panel') : null;
        let pct = '';
        if (panel) {
          const tableRows = Array.from(panel.querySelectorAll('.data-table tbody tr'));
          const values = tableRows.map(function (row) { const cells = row.querySelectorAll('td'); return cells.length>1?parseDisplayedNumber(cells[1].textContent):0; });
          const max = Math.max.apply(null, values);
          pct = max>0?(' ('+ (value/max*100).toFixed(1) + '%)') : '';
        }
        showTooltip('<strong>' + label + '</strong><div>' + value + pct + '</div>', e.clientX + 12, e.clientY - 12);
        return;
      }
    });

    document.addEventListener('mouseout', function (e) {
      const target = e.target;
      if (target.matches('.bar-row b') || target.matches('.mini-bars span')) {
        hideTooltip();
      }
    });
  })();

  // Render pie charts for all .bar-chart containers (replace horizontal bars)
  function renderPieCharts() {
    const palettes = [
      '#60A5FA','#34D399','#FBBF24','#F472B6','#A78BFA','#FB7185','#60A5FA','#34D399'
    ];

    document.querySelectorAll('.bar-chart').forEach(function(chart, chartIndex) {
      const panel = chart.closest('.data-panel');
      if (panel && (panel.id === 'agama' || panel.id === 'mata-pencaharian')) {
        // leave agama to be rendered as a line chart, and keep mata-pencaharian as bar chart
        return;
      }
      // gather rows
      const rows = Array.from(chart.querySelectorAll('.bar-row'));
      if (!rows.length) return;
      const data = rows.map(function(row){
        const labelEl = row.querySelector('span');
        const valueEl = row.querySelector('strong');
        const label = labelEl ? labelEl.textContent.trim() : (row.getAttribute('data-label')||'');
        const value = valueEl ? parseDisplayedNumber(valueEl.textContent) : 0;
        return { label: label, value: value };
      }).filter(d=>d.value>0);
      if (!data.length) return;

      const total = data.reduce((s,d)=>s+d.value,0);

      // build wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'pie-chart-wrapper';

      // SVG pie
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS,'svg');
      svg.setAttribute('viewBox','0 0 200 200');
      svg.classList.add('pie-chart-svg');
      const cx = 100, cy = 100, r = 80;
      let startAngle = -Math.PI/2; // start at top

      data.forEach(function(d,i){
        const sliceAngle = (d.value/total) * Math.PI*2;
        const endAngle = startAngle + sliceAngle;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const large = sliceAngle > Math.PI ? 1 : 0;

        const path = document.createElementNS(svgNS,'path');
        const dpath = [`M ${cx} ${cy}`, `L ${x1} ${y1}`, `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, 'Z'].join(' ');
        path.setAttribute('d', dpath);
        path.setAttribute('fill', palettes[i % palettes.length]);
        path.setAttribute('data-label', d.label);
        path.setAttribute('data-value', d.value);
        svg.appendChild(path);

        startAngle = endAngle;
      });

      wrapper.appendChild(svg);

      // legend
      const legend = document.createElement('div');
      legend.className = 'pie-chart-legend';
      data.forEach(function(d,i){
        const item = document.createElement('div');
        item.className = 'pie-legend-item';
        const sw = document.createElement('span');
        sw.className = 'pie-swatch';
        sw.style.background = palettes[i % palettes.length];
        const txt = document.createElement('span');
        const pct = ((d.value/total)*100).toFixed(1) + '%';
        txt.innerHTML = '<strong>' + d.label + '</strong> — ' + d.value + ' (' + pct + ')';
        item.appendChild(sw);
        item.appendChild(txt);
        legend.appendChild(item);
      });
      wrapper.appendChild(legend);

      // insert wrapper before original chart and mark chart replaced
      chart.parentNode.insertBefore(wrapper, chart);
      chart.classList.add('chart-replaced');

      // Add simple hover tooltip on svg slices
      svg.querySelectorAll('path').forEach(function(p){
        p.addEventListener('mouseenter', function(e){
          const label = p.getAttribute('data-label');
          const value = p.getAttribute('data-value');
          const pct = (parseFloat(value)/total*100).toFixed(1) + '%';
          const evt = new MouseEvent('mouseover', {clientX: e.clientX, clientY: e.clientY});
          // reuse tooltip show function if exists
          const tooltip = document.querySelector('.chart-tooltip');
          if (tooltip) {
            tooltip.innerHTML = '<strong>' + label + '</strong><div>' + value + ' (' + pct + ')</div>';
            tooltip.style.left = (e.clientX + 12) + 'px';
            tooltip.style.top = (e.clientY - 12) + 'px';
            tooltip.classList.add('visible');
          }
        });
        p.addEventListener('mouseleave', function(){
          const tooltip = document.querySelector('.chart-tooltip');
          if (tooltip) tooltip.classList.remove('visible');
        });
      });
    });
  }

  // call renderPieCharts after initial normalization
  renderPieCharts();

  // Render a bar chart specifically for the 'Agama' data-panel
  function renderBarChartForAgama() {
    const panel = document.getElementById('agama');
    if (!panel) return;
    const chart = panel.querySelector('.bar-chart');
    if (!chart) return;

    const rows = Array.from(chart.querySelectorAll('.bar-row'));
    const data = rows.map(function (row) {
      const label = row.querySelector('span') ? row.querySelector('span').textContent.trim() : '';
      const value = row.querySelector('strong') ? parseDisplayedNumber(row.querySelector('strong').textContent) : 0;
      return { label: label, value: value };
    });
    if (!data.length) return;

    const max = Math.max.apply(null, data.map(d => d.value));
    const total = data.reduce((s,d)=>s+d.value,0);

    const palette = ['#60A5FA','#34D399','#FBBF24','#F472B6','#A78BFA','#FB7185','#38BDF8','#F59E0B'];

    // build wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'agama-bar-chart-wrapper';

    data.forEach(function(d,i){
      const rowEl = document.createElement('div');
      rowEl.className = 'agama-bar-row';

      const labelEl = document.createElement('div');
      labelEl.className = 'agama-bar-label';
      labelEl.textContent = d.label;

      const track = document.createElement('div');
      track.className = 'agama-bar-track';
      const fill = document.createElement('div');
      fill.className = 'agama-bar-fill';
      const pct = max > 0 ? (d.value / max) * 100 : 0;
      const displayPct = (max > 500 && pct > 0 && pct < 0.8) ? 0.8 : pct;
      fill.style.width = displayPct.toFixed(2) + '%';
      fill.style.background = palette[i % palette.length];
      track.appendChild(fill);

      const valueEl = document.createElement('div');
      valueEl.className = 'agama-bar-value';
      const pctOfTotal = total>0?((d.value/total)*100).toFixed(1)+'%':'';
      valueEl.textContent = d.value + (pctOfTotal?(' ('+pctOfTotal+')'):'');

      // tooltip
      track.addEventListener('mouseenter', function(e){
        const tooltip = document.querySelector('.chart-tooltip');
        if (tooltip) {
          const pctText = total>0?(' ('+((d.value/total)*100).toFixed(1)+'%)') : '';
          tooltip.innerHTML = '<strong>'+d.label+'</strong><div>'+d.value+pctText+'</div>';
          tooltip.style.left = (e.clientX + 12) + 'px';
          tooltip.style.top = (e.clientY - 12) + 'px';
          tooltip.classList.add('visible');
        }
      });
      track.addEventListener('mouseleave', function(){ const tooltip = document.querySelector('.chart-tooltip'); if (tooltip) tooltip.classList.remove('visible'); });

      rowEl.appendChild(labelEl);
      rowEl.appendChild(track);
      rowEl.appendChild(valueEl);
      wrapper.appendChild(rowEl);
    });

    chart.parentNode.insertBefore(wrapper, chart);
    chart.classList.add('chart-replaced');
  }

  renderBarChartForAgama();
  
  // Render a bar chart for Mata Pencaharian which visually matches the Agama chart style
  function renderBarChartForMataPencaharian() {
    const panel = document.getElementById('mata-pencaharian');
    if (!panel) return;
    const chart = panel.querySelector('.bar-chart');
    if (!chart) return;

    const rows = Array.from(chart.querySelectorAll('.bar-row'));
    const data = rows.map(function (row) {
      const label = row.querySelector('span') ? row.querySelector('span').textContent.trim() : '';
      const value = row.querySelector('strong') ? parseDisplayedNumber(row.querySelector('strong').textContent) : 0;
      return { label: label, value: value };
    });
    if (!data.length) return;

    const max = Math.max.apply(null, data.map(d => d.value));
    const total = data.reduce((s,d)=>s+d.value,0);
    const palette = ['#60A5FA','#34D399','#FBBF24','#F472B6','#A78BFA','#FB7185','#38BDF8','#F59E0B'];

    const wrapper = document.createElement('div');
    wrapper.className = 'agama-bar-chart-wrapper mata-bar-chart-wrapper';

    data.forEach(function(d,i){
      const rowEl = document.createElement('div');
      rowEl.className = 'agama-bar-row';

      const labelEl = document.createElement('div');
      labelEl.className = 'agama-bar-label';
      labelEl.textContent = d.label;

      const track = document.createElement('div');
      track.className = 'agama-bar-track';
      const fill = document.createElement('div');
      fill.className = 'agama-bar-fill';
      const pct = max > 0 ? (d.value / max) * 100 : 0;
      const displayPct = (max > 500 && pct > 0 && pct < 0.8) ? 0.8 : pct;
      fill.style.width = displayPct.toFixed(2) + '%';
      fill.style.background = palette[i % palette.length];
      track.appendChild(fill);

      const valueEl = document.createElement('div');
      valueEl.className = 'agama-bar-value';
      const pctOfTotal = total>0?((d.value/total)*100).toFixed(1)+'%':'';
      valueEl.textContent = d.value + (pctOfTotal?(' ('+pctOfTotal+')'):'');

      track.addEventListener('mouseenter', function(e){
        const tooltip = document.querySelector('.chart-tooltip');
        if (tooltip) {
          const pctText = total>0?(' ('+((d.value/total)*100).toFixed(1)+'%)') : '';
          tooltip.innerHTML = '<strong>'+d.label+'</strong><div>'+d.value+pctText+'</div>';
          tooltip.style.left = (e.clientX + 12) + 'px';
          tooltip.style.top = (e.clientY - 12) + 'px';
          tooltip.classList.add('visible');
        }
      });
      track.addEventListener('mouseleave', function(){ const tooltip = document.querySelector('.chart-tooltip'); if (tooltip) tooltip.classList.remove('visible'); });

      rowEl.appendChild(labelEl);
      rowEl.appendChild(track);
      rowEl.appendChild(valueEl);
      wrapper.appendChild(rowEl);
    });

    chart.parentNode.insertBefore(wrapper, chart);
    chart.classList.add('chart-replaced');
  }

  renderBarChartForMataPencaharian();


  /* =================================================================
     11. HERO PARALLAX SEDERHANA
     Background hero bergerak sedikit lebih lambat saat discroll
     ================================================================= */
  const heroBg = document.getElementById('heroBg');

  function handleParallax() {
    if (!heroBg) return;
    const scrollY = window.scrollY;
    // Hanya terapkan efek di area dekat hero untuk efisiensi
    if (scrollY < window.innerHeight) {
      heroBg.style.transform = 'translateY(' + scrollY * 0.35 + 'px)';
    }
  }


  /* =================================================================
     11. SCROLL REVEAL ANIMATION (Fade Up, Fade Left, Fade Right, Zoom In)
     Menggunakan IntersectionObserver untuk performa terbaik
     ================================================================= */
  const revealElements = document.querySelectorAll(
    '.reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-zoom-in'
  );

  // IntersectionObserver lebih efisien dibanding cek scroll manual,
  // namun kita tetap sediakan fallback revealOnScroll() di bawah
  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target); // Animasi cukup sekali saja
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  revealElements.forEach(function (el) {
    revealObserver.observe(el);
  });

  // Fungsi kosong sebagai placeholder pemanggilan di onScroll()
  // (logika utama reveal sudah ditangani oleh IntersectionObserver di atas)
  function revealOnScroll() {
    // Sengaja dikosongkan: IntersectionObserver menangani semuanya.
    // Fungsi tetap dipanggil di onScroll() untuk konsistensi struktur.
  }


  /* =================================================================
     12. STATISTIK COUNTER (Angka berjalan dari 0 ke nilai target)
     ================================================================= */
  const statNumbers = document.querySelectorAll('.stat-number');
  let countersStarted = false;

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800; // durasi animasi dalam ms
    const startTime = performance.now();

    function updateCount(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing sederhana (ease-out) agar animasi lebih halus
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easedProgress * target);

      el.innerHTML = currentValue + suffix;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        el.innerHTML = target + suffix;
      }
    }

    requestAnimationFrame(updateCount);
  }

  // Memulai counter hanya saat section demografi terlihat di layar
  const statsSection = document.getElementById('demografi');

  if (statsSection) {
    const statsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !countersStarted) {
            countersStarted = true;
            statNumbers.forEach(function (el) {
              animateCounter(el);
            });
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    statsObserver.observe(statsSection);
  }


  /* =================================================================
     13. FOOTER: TAHUN BERJALAN OTOMATIS
     ================================================================= */
  const currentYearEl = document.getElementById('currentYear');
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }


  /* =================================================================
     14. EFEK HOVER TOMBOL (membesar sedikit) - tambahan micro-interaction
     Sudah sebagian ditangani via CSS, namun kita tambahkan ripple
     ringan untuk pengalaman yang lebih hidup
     ================================================================= */
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('mouseenter', function () {
      btn.style.willChange = 'transform';
    });
  });


  /* =================================================================
     15. INISIALISASI AWAL
     Dijalankan terakhir agar seluruh variabel (navbar, heroBg, dll)
     sudah pasti terdeklarasi sebelum onScroll() pertama kali dipanggil
     ================================================================= */
  onScroll();

});

// Ensure the map height matches the contact info column so they appear aligned
function syncMapHeight() {
  const kontakInfo = document.querySelector('.kontak-info');
  const kontakMap = document.querySelector('.kontak-map');
  if (!kontakInfo || !kontakMap) return;
  // Use offsetHeight (includes padding) to match visual height
  const h = kontakInfo.offsetHeight;
  kontakMap.style.height = h + 'px';
}

window.addEventListener('load', function () {
  // Sync after load (images/fonts) and a short timeout for layout
  setTimeout(syncMapHeight, 150);
});

// removed map-sync JS (layout now handled by CSS grid)
