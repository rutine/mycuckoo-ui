import BasicComponent from '../basic/BasicComponent.js';
import writer from './FlowConditionWriter.js';

export function isFlowConditionEntry(entry) {
  return !!(entry && (entry.key === 'conditionExpression' && entry.component === 'ExpressionEditor'));
}

export default class FlowConditionComponent {
  constructor(entry) {
    this.basicComponent = new BasicComponent(entry);
  }

  mount(mountEl) {
    return this.basicComponent.mount(mountEl);
  }
}

export function createEntry(entry, group, element, options) {
  writer.bindFlowConditionEntry(entry, group, element, options);

  return new FlowConditionComponent(entry);
}
