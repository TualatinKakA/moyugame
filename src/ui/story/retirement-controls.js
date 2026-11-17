import { ensureStoryStyles } from './story-modal.js';

export function createRetirementControls({
  document,
  onRequest,
  isEligible = () => false,
}) {
  ensureStoryStyles(document);
  if (typeof onRequest !== 'function') throw new TypeError('Retirement request handler is required');

  const root = document.createElement('section');
  root.className = 'retirement-controls';
  root.setAttribute('aria-label', '退休申请');
  const text = document.createElement('div');
  text.className = 'retirement-controls-text';
  const title = document.createElement('strong');
  title.textContent = '职业周期结算';
  const help = document.createElement('span');
  help.id = 'retirement-control-help';
  text.append(title, help);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'story-button story-button-primary retirement-request-button';
  button.dataset.action = 'request-retirement';
  button.textContent = '申请退休';
  button.setAttribute('aria-describedby', help.id);
  root.append(text, button);

  function render() {
    const eligible = Boolean(isEligible());
    root.dataset.eligible = eligible ? 'true' : 'false';
    help.textContent = eligible
      ? '本轮账面产值已达到 100M（¥100,000,000），可以办理退休结算。'
      : '首次退休要求本轮账面产值达到 100M（¥100,000,000）；提前申请将被人事退回。';
  }

  function request() {
    return onRequest();
  }

  button.addEventListener('click', () => {
    request();
    render();
  });
  render();
  return Object.freeze({ element: root, button, request, render });
}
