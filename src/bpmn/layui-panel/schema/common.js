import {
  createAllValidationDescriptor,
  createFieldValidationDescriptor,
  createValidator
} from '../services/validation.js';
import {
  createFieldWriteDescriptor,
  createWriter
} from '../services/writer.js';

export const EMPTY_PANEL_STATE = {
  title: '未选择节点',
  elementType: '',
  groups: []
};

export const COMPONENTS = {
  EXPRESSION_EDITOR: 'ExpressionEditor',
  PARAMETER_EDITOR: 'ParameterEditor',
  TEXT_INPUT: 'TextInput',
  LISTENER_EDITOR: 'ListenerEditor',
  MULTI_INSTANCE_EDITOR: 'MultiInstanceEditor'
};

export function getElementBusinessObject(element) {
  return element && element.businessObject ? element.businessObject : {};
}

export function getElementType(element) {
  const businessObject = getElementBusinessObject(element);

  return (element && element.type) || businessObject.$type || '';
}

export function getElementTitle(element) {
  const businessObject = getElementBusinessObject(element);

  return businessObject.name || (element && element.id) || businessObject.id || '';
}

export function readElementValue(element, key) {
  const businessObject = getElementBusinessObject(element);

  if (!key) {
    return '';
  }

  if (key === 'conditionExpression') {
    const conditionExpression = businessObject.conditionExpression || (
      typeof businessObject.get === 'function' ? businessObject.get('conditionExpression') : null
    );

    if (!conditionExpression) {
      return '';
    }

    return conditionExpression.body || conditionExpression.value || '';
  }

  if (Object.prototype.hasOwnProperty.call(businessObject, key)) {
    return businessObject[key] === undefined || businessObject[key] === null ? '' : businessObject[key];
  }

  if (typeof businessObject.get === 'function') {
    const value = businessObject.get(key);

    return value === undefined || value === null ? '' : value;
  }

  return '';
}

export function createGroup(id, label, entries = []) {
  return {
    id,
    label,
    entries: createEntries(entries)
  };
}

function createDefaultVisibility() {
  return true;
}

function createDefaultGetter(key) {
  return (element) => readElementValue(element, key);
}

function createDefaultSetter(key) {
  return (value, context = {}) => {
    const groupId = context.groupId || null;
    const element = context.element || null;

    return context.writer && typeof context.writer.writeField === 'function'
      ? context.writer.writeField(groupId, key, value)
      : createFieldWriteDescriptor(element, groupId, key, value);
  };
}

function createDefaultValidator(key) {
  return (value, context = {}) => {
    const groupId = context.groupId || null;
    const element = context.element || null;

    return context.validator && typeof context.validator.validateField === 'function'
      ? context.validator.validateField(groupId, key, value)
      : createFieldValidationDescriptor(element, groupId, key, value);
  };
}

function createDefaultEntryShape(definition = {}) {
  const key = definition.key || '';
  const component = definition.component || COMPONENTS.TEXT_INPUT;

  return {
    component,
    key,
    label: definition.label || key,
    visible: definition.visible || createDefaultVisibility,
    getValue: definition.getValue || createDefaultGetter(key),
    setValue: definition.setValue || createDefaultSetter(key),
    validate: definition.validate || createDefaultValidator(key)
  };
}

export function createEntry(definition = {}) {
  return {
    ...createDefaultEntryShape(definition),
    ...definition
  };
}

export function createEntries(definitions = []) {
  return Array.isArray(definitions)
    ? definitions.map((definition) => createEntry(definition))
    : [];
}

export function createGroups(definitions = []) {
  return definitions.map((definition) => createGroup(definition.id, definition.label, definition.entries));
}

export function createPanelSchema(element, groupDefinitions = []) {
  const schema = {
    title: getElementTitle(element),
    elementType: getElementType(element),
    groups: createGroups(groupDefinitions)
  };

  schema.writer = createWriter(schema, element);
  schema.validator = createValidator(schema, element);

  return schema;
}

export function createEmptyPanelSchema() {
  const schema = createPanelSchema(null, EMPTY_PANEL_STATE.groups);

  schema.title = EMPTY_PANEL_STATE.title;
  schema.elementType = EMPTY_PANEL_STATE.elementType;

  return schema;
}

export function createSimpleEntry(key, label, options = {}) {
  return createEntry({
    component: COMPONENTS.TEXT_INPUT,
    key,
    label,
    ...options
  });
}

export function createBlockEntry(key, label, component, options = {}) {
  return createEntry({
    component,
    key,
    label,
    getValue: options.getValue || (() => null),
    setValue: options.setValue || ((value, context = {}) => {
      const element = context.element || null;

      return createFieldWriteDescriptor(element, context.groupId || null, key, value);
    }),
    validate: options.validate || ((value, context = {}) => {
      const element = context.element || null;

      return createAllValidationDescriptor(element, { [key]: value });
    }),
    ...options
  });
}
