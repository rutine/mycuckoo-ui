import { toStr } from '../../common/utils.js';


export function createMultiInstanceProperties(value) {
  const data = value && typeof value === 'object' ? value : {};

  return {
    enabled: !!data.enabled,
    isSequential: !!data.isSequential,
    collection: toStr(data.collection).trim(),
    elementVariable: toStr(data.elementVariable).trim(),
    loopCardinality: toStr(data.loopCardinality).trim(),
    completionCondition: toStr(data.completionCondition).trim(),
    assigneeMode: toStr(data.assigneeMode).trim(),
    ids: toStr(data.ids).trim(),
    names: toStr(data.names).trim()
  };
}

export function getMultiInstanceSelectedNames(value) {
  const text = toStr(value).trim();

  return text
    ? text.split(/[,\uff0c]/).map((item) => toStr(item).trim()).filter(Boolean)
    : [];
}

export function createState(entry) {
  return createMultiInstanceProperties(entry.getValue());
}

export function applyPickedUsersToValue(value, pickedUsers) {
  return createMultiInstanceProperties({
    ...value,
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
