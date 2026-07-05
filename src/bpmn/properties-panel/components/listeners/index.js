import ListenersComponent, {createEntry} from './ListenersComponent.js';

function supportsEntry(entry) {
  return !!(entry && entry.component === 'ListenerEditor');
}

const listenersComponent = {
  type: 'listeners',
  label: '监听器',
  entryLayout: 'embedded',
  supportsEntry,
  createEntry,
  ListenersComponent
};

export default listenersComponent;
