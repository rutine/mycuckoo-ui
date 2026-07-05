import FlowConditionComponent, {
  createEntry,
  isFlowConditionEntry
} from './FlowConditionComponent.js';

function supportsEntry(entry) {
  return isFlowConditionEntry(entry);
}

const flowConditionComponent = {
  type: 'flowCondition',
  label: '流转条件',
  supportsEntry,
  createEntry,
  FlowConditionComponent
};

export default flowConditionComponent;
