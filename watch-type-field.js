
(function () {
  'use strict';
  if (window.WatchTypeField) return;

  const DEFAULTS = ['Classic', 'Sport', 'Digital'];

  const TABLE = 'watch_types';

  const EN_RE = /^[A-Za-z0-9 .&'\-]+$/;
  const STRIP_RE = /[^A-Za-z0-9 .&'\-]/g;

  let cache      = null;    // string[] — أسماء الأنواع بالترتيب المطلوب
  let loading    = null;    // Promise مشتركة حتى لا نجلب مرتين
  const instances = {};     // id → instance

  function client() {
    try { if (typeof sb !== 'undefined' && sb) return sb; } catch (e) {}
    if (window.sb) return window.sb;
    return null;
  }

  const CLASSES = {
    create: { group:'fg', label:'flabel', input:'finput', err:'ferr' },
    admin:  { group:'form-group', label:'form-label', input:'edit-input', err:'ferr' }
  };

  const CSS = `
.wtf-wrap { position:relative; }
.wtf-input { cursor:pointer; }
.wtf-input.wtf-placeholder { color:var(--text-muted,#8a8371); }
.wtf-panel { position:absolute; z-index:60; inset-inline:0; margin-top:6px;
             background:#151208; border:1px solid rgba(212,175,55,.34);
             border-radius:13px; box-shadow:0 18px 40px rgba(0,0,0,.55);
             padding:9px; display:none; }
.wtf-panel.on { display:block; }
.wtf-search { width:100%; box-sizing:border-box; direction:ltr; text-align:left;
              background:rgba(255,255,255,.04); border:1px solid rgba(212,175,55,.24);
              border-radius:9px; padding:9px 11px; color:var(--text,#efe7d2);
              font-family:inherit; font-size:13px; outline:none; }
.wtf-search:focus { border-color:rgba(212,175,55,.55); }
.wtf-list { margin-top:8px; max-height:210px; overflow-y:auto; }
.wtf-opt { direction:ltr; text-align:left; padding:9px 11px; border-radius:9px;
           color:var(--text,#efe7d2); font-size:13.5px; cursor:pointer;
           border:1px solid transparent; }
.wtf-opt:hover, .wtf-opt.wtf-active { background:rgba(212,175,55,.13);
           border-color:rgba(212,175,55,.30); }
.wtf-opt.wtf-sel { color:var(--gold,#D4AF37); font-weight:700; }
.wtf-add { direction:rtl; text-align:right; color:var(--gold,#D4AF37); font-weight:700;
           background:rgba(212,175,55,.09); border:1px dashed rgba(212,175,55,.42);
           margin-bottom:7px; }
.wtf-add:hover { background:rgba(212,175,55,.18); }
.wtf-empty { padding:11px; text-align:center; font-size:12.5px; color:var(--text-muted,#8a8371); }
.wtf-newbox { display:none; margin-bottom:8px; padding:9px; border-radius:10px;
              background:rgba(212,175,55,.07); border:1px solid rgba(212,175,55,.28); }
.wtf-newbox.on { display:block; }
.wtf-newhint { font-size:11px; color:var(--gold,#D4AF37); opacity:.9; margin-bottom:6px; direction:rtl; }
.wtf-newrow { display:flex; gap:7px; }
.wtf-new { flex:1; min-width:0; }
.wtf-save, .wtf-cancel { border-radius:9px; padding:0 12px; font-family:inherit;
              font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; }
.wtf-save { background:linear-gradient(135deg,#D4AF37,#b8912b); border:none; color:#1a1508; }
.wtf-cancel { background:transparent; border:1px solid rgba(212,175,55,.30); color:var(--text-muted,#8a8371); }
.wtf-err { display:none; margin-top:6px; font-size:11.5px; color:#f87171; direction:rtl; }
.wtf-err.on { display:block; }
`;

  function injectCSS() {
    if (document.getElementById('wtf-style')) return;
    const s = document.createElement('style');
    s.id = 'wtf-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function normalize(raw) {
    const s = String(raw ?? '').trim().replace(/\s+/g, ' ');
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  const isEnglish = (s) => EN_RE.test(String(s ?? '').trim());

  function load(force) {
    if (cache && !force) return Promise.resolve(cache);
    if (loading && !force) return loading;
    loading = (async () => {
      try {
        const db = client();
        if (!db) throw new Error('supabase client not ready');
        const { data, error } = await db
          .from(TABLE).select('name,sort_order')
          .order('sort_order', { ascending: true })
          .order('name',       { ascending: true });
        if (error) throw error;
        cache = (data || []).map(r => r.name).filter(Boolean);
        if (!cache.length) cache = DEFAULTS.slice();
      } catch (e) {
        console.error('watch_types load failed — using built-in list', e);
        cache = DEFAULTS.slice();
      }
      loading = null;
      return cache;
    })();
    return loading;
  }

  const list = () => (cache ? cache.slice() : DEFAULTS.slice());
  const existing = (name) => list().find(n => n.toLowerCase() === String(name).toLowerCase()) || null;

  async function addType(raw) {
    const name = normalize(raw);
    if (!name)            return { ok:false, reason:'empty',   message:'الرجاء إدخال اسم نوع الساعة' };
    if (name.length < 2)  return { ok:false, reason:'short',   message:'الاسم قصير جداً' };
    if (!isEnglish(name)) return { ok:false, reason:'english', message:'الاسم بالإنجليزية فقط (A–Z)' };

    const dupe = existing(name);
    if (dupe) return { ok:true, name:dupe, existed:true, message:`"${dupe}" موجود مسبقاً` };

    try {
      const db = client();
      if (!db) throw new Error('supabase client not ready');
      const { error } = await db.from(TABLE).insert({ name });
      if (error) {

        if (error.code === '23505') {
          await load(true);
          const now = existing(name);
          return { ok:true, name: now || name, existed:true, message:`"${now || name}" موجود مسبقاً` };
        }
        throw error;
      }
    } catch (e) {
      console.error('watch type insert failed', e);
      return { ok:false, reason:'db', message:'تعذّر حفظ النوع الجديد — حاول مجدداً' };
    }

    if (!cache) cache = [];
    cache.push(name);                                 // يظهر فوراً في كل الحقول المفتوحة
    Object.keys(instances).forEach(k => renderList(instances[k]));
    return { ok:true, name, existed:false };
  }

  function renderList(inst) {
    if (!inst || !inst.listEl) return;
    const q = (inst.searchEl.value || '').trim().toLowerCase();
    const all = list();
    const shown = q ? all.filter(n => n.toLowerCase().includes(q)) : all;
    const cur = inst.inputEl.value;

    if (!shown.length) {
      inst.listEl.innerHTML = `<div class="wtf-empty">لا نتيجة لـ "${esc(q)}" — أضِف نوعاً جديداً بالأعلى</div>`;
      return;
    }
    inst.listEl.innerHTML = shown.map(n =>
      `<div class="wtf-opt${n === cur ? ' wtf-sel' : ''}" data-name="${esc(n)}">${esc(n)}</div>`
    ).join('');
  }

  function openPanel(inst) {
    closeAll(inst.id);
    inst.panelEl.classList.add('on');
    inst.open = true;
    inst.searchEl.value = '';
    hideNewBox(inst);

    if (cache) renderList(inst);
    else {
      inst.listEl.innerHTML = '<div class="wtf-empty">⏳ جارٍ التحميل…</div>';
      load().then(() => { if (inst.open) renderList(inst); });
    }
    setTimeout(() => inst.searchEl.focus(), 30);
  }

  function closePanel(inst) {
    if (!inst.panelEl) return;
    inst.panelEl.classList.remove('on');
    inst.open = false;
    hideNewBox(inst);
  }

  function closeAll(exceptId) {
    Object.keys(instances).forEach(k => {
      if (k !== exceptId) closePanel(instances[k]);
    });
  }

  function showNewBox(inst) {
    inst.newBox.classList.add('on');
    inst.newErr.classList.remove('on');
    inst.newEl.value = inst.searchEl.value.replace(STRIP_RE, '');
    setTimeout(() => inst.newEl.focus(), 20);
  }
  function hideNewBox(inst) {
    if (!inst.newBox) return;
    inst.newBox.classList.remove('on');
    inst.newErr.classList.remove('on');
    inst.newEl.value = '';
  }

  function select(inst, name) {
    inst.inputEl.value = name || '';
    inst.inputEl.classList.toggle('wtf-placeholder', !name);
    inst.inputEl.classList.remove('err');
    const errEl = inst.groupEl.querySelector('.' + inst.cls.err);
    if (errEl) errEl.classList.remove('on');
    closePanel(inst);

    inst.inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof inst.onChange === 'function') inst.onChange(name);
  }

  function mount(host, opts) {
    opts = opts || {};
    const el = typeof host === 'string' ? document.querySelector(host) : host;
    if (!el) return null;

    injectCSS();

    const id  = opts.id || ('wtf' + Object.keys(instances).length);
    const cls = Object.assign({}, CLASSES[opts.variant] || CLASSES.create, opts.classes || {});
    const label = opts.label || 'نوع الساعة';

    const wrap = document.createElement('div');
    wrap.className = `${cls.group} wtf-wrap`;
    wrap.innerHTML = `
      <label class="${cls.label}">${esc(label)}</label>
      <input class="${cls.input} wtf-input" type="text" readonly
             placeholder="اختر نوع الساعة" value="${esc(opts.value || '')}" />
      <span class="${cls.err}">⚠ الرجاء اختيار نوع الساعة</span>
      <div class="wtf-panel">
        <div class="wtf-opt wtf-add">➕ إضافة نوع ساعة جديد</div>
        <div class="wtf-newbox">
          <div class="wtf-newhint">بالإنجليزية فقط — سيُحفظ بأول حرف كبير (مثال: rolex ← Rolex)</div>
          <div class="wtf-newrow">
            <input class="wtf-search wtf-new" type="text" placeholder="New watch type" dir="ltr" />
            <button type="button" class="wtf-save">حفظ</button>
            <button type="button" class="wtf-cancel">إلغاء</button>
          </div>
          <div class="wtf-err"></div>
        </div>
        <input class="wtf-search" type="text" placeholder="Search…" dir="ltr" />
        <div class="wtf-list"></div>
      </div>
    `;
    el.appendChild(wrap);

    const inst = {
      id,
      cls,
      open: false,
      onChange: opts.onChange,
      toast: opts.toast,
      groupEl:  wrap,
      inputEl:  wrap.querySelector('.wtf-input'),
      panelEl:  wrap.querySelector('.wtf-panel'),
      searchEl: wrap.querySelector('.wtf-panel > .wtf-search'),
      listEl:   wrap.querySelector('.wtf-list'),
      addEl:    wrap.querySelector('.wtf-add'),
      newBox:   wrap.querySelector('.wtf-newbox'),
      newEl:    wrap.querySelector('.wtf-new'),
      newErr:   wrap.querySelector('.wtf-err'),
      saveEl:   wrap.querySelector('.wtf-save'),
      cancelEl: wrap.querySelector('.wtf-cancel'),
    };
    instances[id] = inst;

    if (!opts.value) inst.inputEl.classList.add('wtf-placeholder');

    inst.inputEl.addEventListener('click', () => {
      if (inst.open) closePanel(inst); else openPanel(inst);
    });

    inst.searchEl.addEventListener('input', () => {
      const clean = inst.searchEl.value.replace(STRIP_RE, '');
      if (clean !== inst.searchEl.value) inst.searchEl.value = clean;
      renderList(inst);
    });
    inst.searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const first = inst.listEl.querySelector('.wtf-opt');
        if (first) select(inst, first.dataset.name);
      }
    });

    inst.listEl.addEventListener('click', (e) => {
      const opt = e.target.closest('.wtf-opt');
      if (opt && opt.dataset.name) select(inst, opt.dataset.name);
    });

    inst.addEl.addEventListener('click', () => showNewBox(inst));
    inst.cancelEl.addEventListener('click', () => hideNewBox(inst));
    inst.newEl.addEventListener('input', () => {
      const clean = inst.newEl.value.replace(STRIP_RE, '');
      if (clean !== inst.newEl.value) {
        inst.newEl.value = clean;
        inst.newErr.textContent = 'بالإنجليزية فقط (A–Z)';
        inst.newErr.classList.add('on');
      } else {
        inst.newErr.classList.remove('on');
      }
    });
    inst.newEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveNew(inst); }
    });
    inst.saveEl.addEventListener('click', () => saveNew(inst));

    if (!document.__wtfDocBound) {
      document.__wtfDocBound = true;
      document.addEventListener('click', (e) => {
        Object.keys(instances).forEach(k => {
          const i = instances[k];
          if (i.open && !i.groupEl.contains(e.target)) closePanel(i);
        });
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') Object.keys(instances).forEach(k => closePanel(instances[k]));
      });
    }

    load();          // تسخين القائمة مبكراً
    return inst;
  }

  async function saveNew(inst) {
    const btn = inst.saveEl;
    btn.disabled = true;
    const res = await addType(inst.newEl.value);
    btn.disabled = false;

    if (!res.ok) {
      inst.newErr.textContent = res.message;
      inst.newErr.classList.add('on');
      return;
    }
    hideNewBox(inst);
    select(inst, res.name);
    if (typeof inst.toast === 'function') {
      if (res.existed) inst.toast('error', 'ℹ️', res.message);
      else             inst.toast('success', '✅', `تمت إضافة "${res.name}"`);
    }
  }

  window.WatchTypeField = {
    DEFAULTS,
    normalize,
    isEnglish,
    load,
    list,
    addType,
    mount,
    has:      (id) => !!instances[id],
    getValue: (id) => (instances[id] ? instances[id].inputEl.value.trim() : ''),
    getInput: (id) => (instances[id] ? instances[id].inputEl : null),
    setValue: (id, v) => { if (instances[id]) select(instances[id], v || ''); },
    destroy:  (id) => {
      const i = instances[id];
      if (!i) return;
      if (i.groupEl && i.groupEl.parentNode) i.groupEl.parentNode.removeChild(i.groupEl);
      delete instances[id];
    },
  };
})();
