
(function () {
  'use strict';

  var URGENT = 'ضروري جدا';
  var HIGH   = 'ضروري';
  var NORMAL = 'عادي';

  var META = [
    { value: URGENT, key: 'urgent', icon: '●', hint: 'تُنفَّذ قبل كل شيء' },
    { value: HIGH,   key: 'high',   icon: '●', hint: 'قبل الطلبيات العادية' },
    { value: NORMAL, key: 'normal', icon: '●', hint: 'الأولوية الافتراضية' }
  ];
  var VALUES  = META.map(function (m) { return m.value; });
  var DEFAULT = NORMAL;

  var instances = {};   // id -> { host, select, onChange }

  var CSS = [
    '.opr-select.opr-urgent { border-color: rgba(239,68,68,0.55); color:#fca5a5; }',
    '.opr-select.opr-high   { border-color: rgba(59,130,246,0.55); color:#93c5fd; }',
    '.opr-hint { font-size:11.5px; margin-top:6px; color:var(--text-muted,#9b9186); }',
    '.opr-hint .opr-dot { font-size:9px; }',
    '.opr-dot-urgent { color:#ef4444; }',
    '.opr-dot-high   { color:#3b82f6; }',
    '.opr-dot-normal { color:var(--gold,#D4AF37); }'
  ].join('\n');

  function injectCss() {
    if (document.getElementById('opr-css')) return;
    var st = document.createElement('style');
    st.id = 'opr-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function normalize(raw) {
    if (raw == null) return DEFAULT;
    var s = String(raw).replace(/\s+/g, ' ').trim();
    if (!s) return DEFAULT;

    s = s.replace(/جدا[ًٌٍ]/, 'جدا');
    for (var i = 0; i < META.length; i++) {
      if (META[i].value === s || META[i].key === s) return META[i].value;
    }
    return DEFAULT;
  }

  function metaOf(raw) {
    var v = normalize(raw);
    for (var i = 0; i < META.length; i++) if (META[i].value === v) return META[i];
    return META[META.length - 1];
  }

  function keyOf(raw) { return metaOf(raw).key; }

  function optionsHtml(selected) {
    var sel = normalize(selected);
    return META.map(function (m) {
      return '<option value="' + m.value + '"' + (m.value === sel ? ' selected' : '') + '>' +
             m.value + '</option>';
    }).join('');
  }

  function mount(host, opts) {
    opts = opts || {};
    var el = typeof host === 'string' ? document.querySelector(host) : host;
    if (!el) return null;
    injectCss();

    var id    = opts.id || 'orderPriority';
    var value = normalize(opts.value);
    var label = opts.label || '⚡ أولوية الطلبية';
    var hint  = opts.hint  !== undefined ? opts.hint
              : 'الافتراضي <span class="opr-dot opr-dot-normal">●</span> عادي — غيّرها فقط عند الحاجة';

    el.innerHTML =
      '<div class="fsec opr-sec">' +
        '<div class="slabel">' + label + '</div>' +
        '<div class="fg">' +
          '<select id="' + id + '" class="fselect opr-select opr-' + keyOf(value) + '">' +
            optionsHtml(value) +
          '</select>' +
          (hint ? '<div class="opr-hint">' + hint + '</div>' : '') +
        '</div>' +
      '</div>';

    var select = document.getElementById(id);
    instances[id] = { host: el, select: select, onChange: opts.onChange || null };
    select.addEventListener('change', function () { paint(id); });
    return select;
  }

  function paint(id) {
    var inst = instances[id];
    if (!inst || !inst.select) return;
    var v = normalize(inst.select.value);
    inst.select.className = 'fselect opr-select opr-' + keyOf(v);
    if (inst.onChange) inst.onChange(v);
  }

  function getSelect(id) {
    var inst = instances[id || 'orderPriority'];
    return (inst && inst.select) || document.getElementById(id || 'orderPriority') || null;
  }

  function getValue(id) {
    var s = getSelect(id);
    return normalize(s ? s.value : DEFAULT);
  }
  function setValue(id, v) {
    var s = getSelect(id);
    if (!s) return;
    s.value = normalize(v);
    paint(id || 'orderPriority');
  }
  function reset(id) { setValue(id, DEFAULT); }
  function has(id)   { return !!getSelect(id); }
  function destroy(id) {
    var inst = instances[id];
    if (!inst) return;
    if (inst.host) inst.host.innerHTML = '';
    delete instances[id];
  }

  window.OrderPriority = {
    URGENT: URGENT, HIGH: HIGH, NORMAL: NORMAL,
    VALUES: VALUES, DEFAULT: DEFAULT, META: META,
    normalize: normalize, metaOf: metaOf, keyOf: keyOf, optionsHtml: optionsHtml,
    mount: mount, getValue: getValue, setValue: setValue, reset: reset,
    getSelect: getSelect, has: has, destroy: destroy
  };
})();
