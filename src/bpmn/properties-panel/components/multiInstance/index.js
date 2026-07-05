import MultiInstanceComponent, {createEntry} from './MultiInstanceComponent.js';

function supportsEntry(entry) {
  return !!(entry && entry.component === 'MultiInstanceEditor');
}

const multiInstanceComponent = {
  type: 'multiInstance',
  label: '多实例',
  entryLayout: 'embedded',
  supportsEntry,
  createEntry,
  MultiInstanceComponent
};

export default multiInstanceComponent;
