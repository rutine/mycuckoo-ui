import {
  getProperty,
  getBusinessObject,
  updateModdleProperties, getExpressionBody
} from '../../../ModdleUtils.js';
import { findGroupEntry } from '../../common/utils.js';

function writeDefaultExpression(context, element) {
  const businessObject = getBusinessObject(element);
  let conditionExpression = getProperty(businessObject, 'conditionExpression');
  if (conditionExpression) {
    return conditionExpression;
  }

  conditionExpression = context.moddle.create('bpmn:FormalExpression', { body: '' });
  conditionExpression.$parent = businessObject;

  context.modeling.updateProperties(element, { conditionExpression });

  return conditionExpression;
}

function writeExpression(context, element, body = '') {
  const conditionExpression = writeDefaultExpression(context, element);
  if (!conditionExpression) {
    return {updated: false, notApplied: true, reason: 'missing-condition-expression'};
  }

  const result = updateModdleProperties(
      context.commandStack,
      element,
      conditionExpression,
      {
        body: typeof body === 'string' ? body : ''
      }
  );

  return {updated: true, result, conditionExpression};
}


function getFlowCondition(element) {
  const businessObject = getBusinessObject(element);
  const conditionExpression = getProperty(businessObject, 'conditionExpression');
  return getExpressionBody(conditionExpression);
}

function setFlowCondition(context, element, value = '') {
  return writeExpression(context, element, value);
}

function createFlowConditionEntryAdapter(entry, element, options = {}) {
  const context = options.context || null;
  if (!entry) {
    return entry;
  }

  entry.getValue = () => getFlowCondition(element);
  entry.setValue = (value = '') => setFlowCondition(context, element, value);

  return entry;
}

function bindFlowConditionEntry(entry, group, element, options = {}) {
  if (!!(entry && group && group.id !== 'flow-condition' && entry.key !== 'conditionExpression')) {
    return;
  }

  createFlowConditionEntryAdapter(entry, element, options);
}

export default {
  bindFlowConditionEntry
};
