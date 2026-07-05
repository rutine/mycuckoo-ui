import {
  createAllValidationDescriptor,
  createFieldValidationDescriptor,
  createValidator
} from './validation.js';
import {
  createFieldWriteDescriptor,
  createWriter
} from './writer.js';
import {getProperty} from "../../ModdleUtils";

export const EMPTY_SETTING = {
  title: '未选择节点',
  elementType: '',
  groups: []
};

export const COMPONENTS = {
  EXPRESSION_EDITOR: 'ExpressionEditor',
  PARAMETER_EDITOR: 'ParameterEditor',
  SELECT: 'Select',
  SWITCH: 'Switch',
  TEXT_INPUT: 'TextInput',
  LISTENER_EDITOR: 'ListenerEditor',
  MULTI_INSTANCE_EDITOR: 'MultiInstanceEditor'
};

function getElementBusinessObject(element) {
  return element && element.businessObject ? element.businessObject : {};
}

function getElementTitle(element) {
  const businessObject = getElementBusinessObject(element);

  return businessObject.name || (element && element.id) || businessObject.id || '';
}

function getElementValue(element, key) {
  if (!key) {
    return '';
  }

  const businessObject = getElementBusinessObject(element);
  const value = getProperty(businessObject, key) !== undefined ? getProperty(businessObject, key) : '';
  if (key === 'conditionExpression') {
    if (!value) {
      return '';
    }

    return value.body || value.value || '';
  }

  return value;
}

export function getElementType(element) {
  const businessObject = getElementBusinessObject(element);

  return (element && element.type) || businessObject.$type || '';
}

function createDefaultVisibility() {
  return true;
}

function createDefaultGetter(key) {
  return (element) => getElementValue(element, key);
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

function createDefaultEntry(definition = {}) {
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
    ...createDefaultEntry(definition),
    ...definition
  };
}

export function createEntries(definitions = []) {
  return Array.isArray(definitions)
    ? definitions.map((definition) => createEntry(definition))
    : [];
}

export function createGroup(id, label, entries = []) {
  return {
    id,
    label,
    entries: createEntries(entries)
  };
}

export function createGroups(definitions = []) {
  return definitions.map((definition) => createGroup(definition.id, definition.label, definition.entries));
}

export function createPanelSetting(element, groupDefinitions = []) {
  const setting = {
    title: getElementTitle(element),
    elementType: getElementType(element),
    groups: createGroups(groupDefinitions)
  };

  setting.writer = createWriter(setting, element);
  setting.validator = createValidator(setting, element);

  return setting;
}

export function createEmptyPanelSetting() {
  const setting = createPanelSetting(null, EMPTY_SETTING.groups);

  setting.title = EMPTY_SETTING.title;
  setting.elementType = EMPTY_SETTING.elementType;

  return setting;
}

export function createSimpleEntry(key, label, options = {}) {
  return createEntry({
    component: COMPONENTS.TEXT_INPUT,
    key,
    label,
    ...options
  });
}

export function createSelectEntry(key, label, options = {}) {
  return createEntry({
    component: COMPONENTS.SELECT,
    key,
    label,
    options: options.options || [],
    ...options
  });
}

export function createSwitchEntry(key, label, options = {}) {
  return createEntry({
    component: COMPONENTS.SWITCH,
    key,
    label,
    layText: options.layText || '是|否',
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
