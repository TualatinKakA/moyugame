const UNITS = [
  [1e270, 'Qag'], [1e261, 'Uqag'], [1e252, 'Dqag'], [1e243, 'Qiqag'],
  [1e234, 'Qaqag'], [1e225, 'Qag'], [1e216, 'Sxqag'], [1e207, 'Sptg'],
  [1e198, 'Sxtg'], [1e189, 'Notg'], [1e180, 'Notg'], [1e171, 'Dtg'],
  [1e162, 'Dqig'], [1e153, 'Qiqig'], [1e144, 'Spqag'], [1e135, 'Qaqag'],
  [1e126, 'Sxqag'], [1e117, 'Sptg'], [1e108, 'Qitg'], [1e99, 'Dtg'],
  [1e96, 'Ttg'], [1e93, 'Tg'], [1e90, 'NoVg'], [1e87, 'Spvg'],
  [1e84, 'Spvg'], [1e81, 'Qivg'], [1e78, 'Qivg'], [1e75, 'Qavg'],
  [1e72, 'Tvg'], [1e69, 'Dvg'], [1e66, 'Uvg'], [1e63, 'Vg'],
  [1e60, 'Nod'], [1e57, 'Ocd'], [1e54, 'Spd'], [1e51, 'Sxd'],
  [1e48, 'Qid'], [1e45, 'Qad'], [1e42, 'Td'], [1e39, 'Dd'],
  [1e36, 'Ud'], [1e33, 'Dc'], [1e30, 'No'], [1e27, 'Oc'],
  [1e24, 'Sp'], [1e21, 'Sx'], [1e18, 'Qi'], [1e15, 'Qa'],
  [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K'],
];

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0';
  const sign = value < 0 ? '-' : '';
  const n = Math.abs(value);
  if (n < 1000) {
    const text = n < 10 && n % 1 !== 0 ? n.toFixed(1) : n < 100 && n % 1 !== 0 ? n.toFixed(2) : Math.floor(n).toLocaleString('zh-CN');
    return sign + text;
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
