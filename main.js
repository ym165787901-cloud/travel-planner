/* Wanderline: main.js
   Sections: 1 Content · 2 i18n · 3 Filters · 4 Budget chart · 5 Itinerary · 6 Router · 7 Motion */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- 1. CONTENT (EN formal agency tone / AR Egyptian colloquial) ---------- */
const I18N = {
  en: {
    nav_home:'Home', nav_hub:"Traveler's Hub",
    h_title:'Journeys composed with precision.',
    h_sub:'A bespoke planning platform for discerning travelers, from the first idea to the final itinerary.',
    h_cta:'Explore journeys', f_title:'Find your next journey',
    f_budget:'Budget', f_type:'Trip type', f_dest:'Destination', all:'All',
    low:'Under $1,000', mid:'$1,000 to $2,000', high:'Over $2,000',
    adventure:'Adventure', relaxation:'Relaxation', cultural:'Cultural',
    none:'No journeys match these filters. Try widening your criteria.', from:'From',
    dahab:'Dahab', siwa:'Siwa', luxor:'Luxor', santorini:'Santorini', kyoto:'Kyoto', cappadocia:'Cappadocia',
    tr_dahab:'Dahab Reef Expedition', tr_siwa:'Siwa Oasis Retreat', tr_luxor:'Luxor Heritage Journey',
    tr_santorini:'Santorini Sunset Suite', tr_kyoto:'Kyoto Temple Trails', tr_cappadocia:'Cappadocia Balloon Escape',
    s_trips:'Upcoming trips', s_budget:'Total budget', s_pts:'Reward points',
    d_budget:'Budget allocation', d_plan:'Daily itinerary',
    food:'Food', stays:'Stays', flights:'Flights', day:'Day'
  },
  ar: {
    nav_home:'الرئيسية', nav_hub:'مركز المسافر',
    h_title:'يلا نسافر.. وسيب التخطيط علينا!',
    h_sub:'من أول فكرة لحد آخر يوم في الرحلة، بنظبطلك كل حاجة بشياكة وبمنتهى السهولة.',
    h_cta:'شوف الرحلات', f_title:'دوّر على رحلتك الجاية',
    f_budget:'الميزانية', f_type:'نوع الرحلة', f_dest:'الوجهة', all:'الكل',
    low:'أقل من 1,000$', mid:'من 1,000$ لـ 2,000$', high:'أكتر من 2,000$',
    adventure:'مغامرة', relaxation:'استجمام', cultural:'ثقافة',
    none:'مفيش رحلات مطابقة.. جرّب تغيّر الفلاتر!', from:'بداية من',
    dahab:'دهب', siwa:'سيوة', luxor:'الأقصر', santorini:'سانتوريني', kyoto:'كيوتو', cappadocia:'كابادوكيا',
    tr_dahab:'مغامرة الغوص في دهب', tr_siwa:'فسحة هادية في واحة سيوة', tr_luxor:'رحلة في تاريخ الأقصر',
    tr_santorini:'غروب سانتوريني الساحر', tr_kyoto:'جولة المعابد في كيوتو', tr_cappadocia:'بالون كابادوكيا الجامد',
    s_trips:'رحلاتك الجاية', s_budget:'إجمالي الميزانية', s_pts:'نقاط المكافآت',
    d_budget:'فلوسك رايحة فين؟', d_plan:'خطة الأيام',
    food:'أكل', stays:'إقامة', flights:'طيران', day:'اليوم'
  }
};

// [destination, type, budget tier, price in USD, placeholder hue]
const TRIPS = [
  ['dahab','adventure','low',780,190], ['siwa','relaxation','low',640,40],
  ['luxor','cultural','mid',1450,35], ['santorini','relaxation','high',2600,215],
  ['kyoto','cultural','high',3100,320], ['cappadocia','adventure','mid',1700,12]
];
// [category, share %, colour]
const BUDGET = [['food',28,'#4ae3ff'], ['stays',42,'#9b7bff'], ['flights',30,'#e6b866']];
const TOTAL = 4850;
// Per day: [time, English, Arabic, map x %, map y %]
const DAYS = [
  [['07:00','Sunrise snorkel at the Blue Hole','سنوركلينج وقت الشروق في البلو هول',22,30],
   ['13:00','Seafront lunch in Lighthouse','غدا على البحر في اللايت هاوس',48,58],
   ['19:00','Bedouin dinner under the stars','عشا بدوي تحت النجوم',74,36]],
  [['08:30','Jeep safari to Ras Abu Galum','سفاري بالجيب لرأس أبو جلوم',30,68],
   ['12:30','Kayak across the protected bay','كاياك في الخليج المحمي',58,26],
   ['18:00','Sunset yoga on the pier','يوجا وقت الغروب على المرسى',80,62]],
  [['10:00','Spa morning and slow brunch','سبا وفطار رايق',26,44],
   ['15:00','Souk walk and gifts','لفة في السوق وهدايا',54,70],
   ['21:00','Farewell rooftop dinner','عشا الوداع على الروف',76,30]]
];

/* ---------- 2. i18n ---------- */
let lang = 'en';
try { lang = localStorage.getItem('wl-lang') || 'en'; } catch (_) {}
const t = k => I18N[lang][k] ?? k;

function applyLang() {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $('#langBtn').textContent = lang === 'ar' ? 'English' : 'عربي';
  document.title = lang === 'ar' ? 'وندرلاين | مخطط الرحلات' : 'Wanderline | Travel Planner';
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  buildFilters(); renderTrips(); renderChart(); renderPlan();
}
$('#langBtn').addEventListener('click', () => {
  lang = lang === 'en' ? 'ar' : 'en';
  try { localStorage.setItem('wl-lang', lang); } catch (_) {}
  applyLang();
});

/* ---------- 3. FILTERS (instant, client-side) ---------- */
const F = { budget:'all', type:'all', dest:'all' };
const OPTS = { budget:['low','mid','high'], type:['adventure','relaxation','cultural'], dest:TRIPS.map(x => x[0]) };

function buildFilters() {
  $('#filters').innerHTML = Object.keys(OPTS).map(k => `
    <label><span>${t('f_' + k)}</span>
      <select data-k="${k}"><option value="all">${t('all')}</option>
        ${OPTS[k].map(o => `<option value="${o}"${F[k] === o ? ' selected' : ''}>${t(o)}</option>`).join('')}
      </select></label>`).join('');
}
function renderTrips() {
  const list = TRIPS.filter(([d, ty, b]) =>
    (F.budget === 'all' || F.budget === b) && (F.type === 'all' || F.type === ty) && (F.dest === 'all' || F.dest === d));
  $('#grid').innerHTML = list.length ? list.map(([d, ty, , price, hue], i) => `
    <article class="card" style="--i:${i};--h:${hue}">
      <div class="thumb"><span class="tag">${t(ty)}</span></div>
      <div class="body"><h3>${t('tr_' + d)}</h3><p>${t(d)}</p>
        <strong>${t('from')} $${price.toLocaleString('en-US')}</strong></div>
    </article>`).join('') : `<p class="empty">${t('none')}</p>`;
}
$('#filters').addEventListener('change', e => {
  if (!e.target.dataset.k) return;
  F[e.target.dataset.k] = e.target.value;
  renderTrips();
});

/* ---------- 4. BUDGET CHART (pure SVG donut) ---------- */
function renderChart() {
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = BUDGET.map(([k, pct, col]) => {
    const len = C * pct / 100, o = offset;
    offset += len;
    return `<circle class="seg" data-k="${k}" data-len="${len - 3}" cx="100" cy="100" r="${R}"
      stroke="${col}" style="--c:${col};stroke-dasharray:0 ${C};stroke-dashoffset:${-o}"/>`;
  }).join('');
  const legend = BUDGET.map(([k, pct, col]) =>
    `<li data-k="${k}" style="--c:${col}"><i></i>${t(k)}<span>${pct}%</span></li>`).join('');
  $('#chart').innerHTML = `
    <div class="donut"><svg viewBox="0 0 200 200">${arcs}</svg>
      <div class="center"><b id="cVal"></b><small id="cLbl"></small></div></div>
    <ul class="leg">${legend}</ul>`;
  focusSeg(null);
  // Double rAF so the browser registers the 0-length state before animating to full length
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('.seg', $('#chart')).forEach(s => { s.style.strokeDasharray = `${s.dataset.len} ${C}`; });
  }));
}
function focusSeg(k) {
  $$('.seg, .leg li', $('#chart')).forEach(el => el.classList.toggle('dim', !!k && el.dataset.k !== k));
  const b = BUDGET.find(x => x[0] === k);
  const val = b ? Math.round(TOTAL * b[1] / 100) : TOTAL;
  if (!$('#cVal')) return;
  $('#cVal').textContent = '$' + val.toLocaleString('en-US');
  $('#cLbl').textContent = b ? `${t(k)} (${b[1]}%)` : t('s_budget');
}
$('#chart').addEventListener('pointerover', e => { const n = e.target.closest('[data-k]'); if (n) focusSeg(n.dataset.k); });
$('#chart').addEventListener('mouseleave', () => focusSeg(null));

/* ---------- 5. ITINERARY ---------- */
let day = 0, act = 0;
function renderPlan() {
  $('#tabs').innerHTML = DAYS.map((_, i) =>
    `<button type="button" class="${i === day ? 'on' : ''}" data-day="${i}">${t('day')} ${i + 1}</button>`).join('');
  $('#acts').innerHTML = DAYS[day].map((a, i) =>
    `<li class="${i === act ? 'on' : ''}" data-act="${i}" style="--i:${i}"><time>${a[0]}</time>${a[lang === 'ar' ? 2 : 1]}</li>`).join('');
  $('#map').innerHTML = DAYS[day].map((a, i) =>
    `<i class="pin ${i === act ? 'on' : ''}" data-act="${i}" style="left:${a[3]}%;top:${a[4]}%"><b>${i + 1}</b></i>`).join('');
}
function setAct(i) {
  act = i;
  $$('#acts li, #map .pin').forEach(el => el.classList.toggle('on', +el.dataset.act === i));
}
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-day]');
  if (b) { day = +b.dataset.day; act = 0; renderPlan(); }
});
$('.plan').addEventListener('pointerover', e => { const n = e.target.closest('[data-act]'); if (n) setAct(+n.dataset.act); });
$('.plan').addEventListener('click', e => { const n = e.target.closest('[data-act]'); if (n) setAct(+n.dataset.act); });

/* ---------- 6. ROUTER + PAGE TRANSITIONS ---------- */
const curtain = $('.curtain');
let current = 'home', busy = false;

function countUp() {
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, pre = el.dataset.pre || '', start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / 1200, 1);
      el.textContent = pre + Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
function show(view) {
  current = view;
  $$('.view').forEach(v => { v.hidden = v.id !== view; });
  $$('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === view));
  window.scrollTo(0, 0);
  if (view === 'dashboard') { renderChart(); renderPlan(); countUp(); }
}
function go(view) {
  if (view === current || busy) return;
  busy = true;
  curtain.classList.add('on');                       // cover the screen
  setTimeout(() => {
    show(view);                                      // swap views while covered
    curtain.classList.remove('on');                  // wipe away to reveal
    setTimeout(() => { busy = false; }, 650);
  }, 650);
}
window.addEventListener('hashchange', () => go(location.hash === '#/dashboard' ? 'dashboard' : 'home'));

/* ---------- 7. MOTION: parallax ---------- */
const layers = $$('[data-parallax]');
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    layers.forEach(el => { el.style.transform = `translate3d(0,${y * el.dataset.parallax}px,0) scale(1.1)`; });
    $('.hero__txt').style.opacity = Math.max(0, 1 - y / 650);
    ticking = false;
  });
}, { passive: true });

/* ---------- Boot ---------- */
applyLang(); // also renders the trip grid, chart and itinerary
show(location.hash === '#/dashboard' ? 'dashboard' : 'home');
})();
