import { toStr } from './utils.js';

export function escapeHtml(value) {
  return toStr(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeAttr(value) {
  return escapeHtml(value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function htmlToElement(documentRef, html) {
  const templateEl = documentRef.createElement('template');
  templateEl.innerHTML = toStr(html).trim();

  return templateEl.content.firstElementChild;
}

export function renderHtml(mountEl, html) {
  if (!mountEl) {
    return;
  }

  mountEl.innerHTML = toStr(html);
}
