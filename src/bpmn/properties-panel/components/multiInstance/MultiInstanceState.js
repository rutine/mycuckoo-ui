import { toStr } from '../../common/utils.js';

export function getEntryValue(entry) {
  if (!entry || typeof entry.getValue !== 'function') {
    return null;
  }

  try {
    return entry.getValue();
  } catch (error) {
    return null;
  }
}

export function createMultiInstanceProperties(value) {
  const draft = value && typeof value === 'object' ? value : {};

  return {
    enabled: !!draft.enabled,
    isSequential: !!draft.isSequential,
    collection: toStr(draft.collection).trim(),
    elementVariable: toStr(draft.elementVariable).trim(),
    loopCardinality: toStr(draft.loopCardinality).trim(),
    completionCondition: toStr(draft.completionCondition).trim(),
    assigneeMode: toStr(draft.assigneeMode).trim(),
    ids: toStr(draft.ids).trim(),
    names: toStr(draft.names).trim()
  };
}

export function getMultiInstanceSelectedNames(value) {
  const text = toStr(value).trim();

  return text
    ? text.split(/[,\uff0c]/).map((item) => toStr(item).trim()).filter(Boolean)
    : [];
}

export function createState(entry) {
  return createMultiInstanceProperties(getEntryValue(entry));
}

export function applyPickedUsersToDraft(draft, pickedUsers) {
  return createMultiInstanceProperties({
    ...draft,
    assigneeMode: 'user',
    ids: Array.isArray(pickedUsers)
      ? pickedUsers
        .map((user) => user && user.id)
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
        .map((value) => String(value).trim())
        .join(',')
      : '',
    names: Array.isArray(pickedUsers)
      ? pickedUsers
        .map((user) => user && user.name)
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
        .map((value) => String(value).trim())
        .join(',')
      : ''
  });
}
