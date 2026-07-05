import BasicComponent, { isBasicEntry, createEntry } from './BasicComponent.js';

function supportsEntry(entry) {
  return isBasicEntry(entry);
}

const basicComponent = {
  type: 'basic',
  label: '基础属性',
  supportsEntry,
  createEntry,
  BasicComponent
};

export default basicComponent;
