export function toStr(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value);
}

export function getStr(value, defaultValue = '') {
  return typeof value === 'string' ? value : defaultValue;
}

export function getElementId(element) {
  if (!element) {
    return null;
  }

  return element.id || (element.businessObject && element.businessObject.id) || null;
}

export function getGroupEntries(panelState, groupId) {
  const groups = panelState && Array.isArray(panelState.groups) ? panelState.groups : [];
  const group = groups.find((candidate) => candidate && candidate.id === groupId);

  return group && Array.isArray(group.entries)
    ? group.entries
    : null;
}

export function findGroupEntry(panelState, groupId, entryKey) {
  const entries = getGroupEntries(panelState, groupId);

  if (!entries) {
    return null;
  }

  return entries.find((candidate) => candidate && candidate.key === entryKey) || null;
}

export function appendClassName(element, className) {
  if (!element || !className) {
    return;
  }

  const tokens = toStr(element.className)
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.indexOf(className) !== -1) {
    return;
  }

  tokens.push(className);
  element.className = tokens.join(' ');
}

export function removeClassName(element, className) {
  if (!element || !className) {
    return;
  }

  element.className = toStr(element.className)
    .split(/\s+/)
    .filter((token) => token && token !== className)
    .join(' ');
}

export function toggleClassName(element, className, enabled) {
  if (enabled) {
    appendClassName(element, className);
    return;
  }

  removeClassName(element, className);
}
