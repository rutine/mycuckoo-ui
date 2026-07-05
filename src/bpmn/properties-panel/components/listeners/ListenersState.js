import { toStr } from '../../common/utils.js';

export const LAYUI_SELECT_BINDING_PROP = '__layuiSelectBinding';
export const LAYUI_SELECT_FILTER_PROP = '__layuiSelectFilter';

export function getEntryValue(entry) {
  if (!entry || typeof entry.getValue !== 'function') {
    return null;
  }

  return entry.getValue();
}

export function createListenerDraft(value = {}) {
  return {
    event: toStr(value.event).trim() || 'assignment',
    type: toStr(value.type).trim() || 'expression',
    value: toStr(value.value)
  };
}

export function createListenerValue(value) {
  const items = value && Array.isArray(value.items) ? value.items : [];

  return {
    items: items.map((item) => createListenerDraft(item))
  };
}

export function syncListenerItems(state, value) {
  const normalizedValue = createListenerValue(value);

  state.items = normalizedValue.items;

  return state;
}
