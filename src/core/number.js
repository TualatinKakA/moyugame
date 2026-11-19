const UNITS = [
  [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K'],
];

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0';
  const sign = value < 0 ? '-' : '';
  const n = Math.abs(value);
  if (n < 10000) {
    const text = n < 10 && n % 1 !== 0 ? n.toFixed(1) : n < 100 && n % 1 !== 0 ? n.toFixed(2) : Math.floor(n).toLocaleString('zh-CN');
    return sign + text;
  }
  if (n >= 1e15) {
    const [coefficient, exponent] = n.toExponential(4).split('e');
    return `${sign}${coefficient}e${Number(exponent)}`;
  }
  const unit = UNITS.find(([v]) => n >= v);
  if (!unit) return sign + n.toExponential(2).replace('+', '');
  const scaled = n / unit[0];
  const text = scaled < 10 ? scaled.toFixed(digits) : scaled < 100 ? scaled.toFixed(1) : Math.floor(scaled).toString();
  return sign + text + unit[1];
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
