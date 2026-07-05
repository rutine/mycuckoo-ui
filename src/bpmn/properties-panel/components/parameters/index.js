import ParametersComponent, {createEntry, isParametersEntry} from './ParametersComponent.js';

function supportsEntry(entry) {
  return isParametersEntry(entry);
}

const parametersComponent = {
  type: 'parameters',
  label: '参数',
  supportsEntry,
  createEntry,
  ParametersComponent
};

export default parametersComponent;
