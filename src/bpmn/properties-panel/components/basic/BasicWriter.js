import {getElementId, toStr,} from '../../common/utils.js';
import {getProperty} from "../../../ModdleUtils";

const DEFAULT_USER_TASK_ASSIGNEE = '${assignee}';

function writeDefaultProperties(element, context) {
  if (!element || element.type !== 'bpmn:UserTask') {
    return;
  }

  const value = toStr(getProperty(element.businessObject, 'flowable:assignee'));
  if (!value.trim()) {
    context.modeling.updateProperties(element, {
      'flowable:assignee': DEFAULT_USER_TASK_ASSIGNEE
    });
  }
}

function writeProperties(element, context, fieldId, value) {
  if (!element || !fieldId) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-context'
    };
  }

  const nextValue = typeof value === 'boolean' ? value : toStr(value);
  return {
    updated: true,
    result: context.modeling.updateProperties(element, {
      [fieldId]: nextValue === '' ? undefined : nextValue
    })
  };
}

function createEntryAdapter(entry, group, panelState, element, options = {}) {
  const context = options.context || null;
  const uiState = options.uiState || null;
  const getRawValue = typeof entry.getValue === 'function' ? entry.getValue : null;
  const setRawValue = typeof entry.setValue === 'function' ? entry.setValue : null;
  const rawValidate = typeof entry.validate === 'function' ? entry.validate : null;

  if (getRawValue) {
    entry.getValue = () => {
      const value = getRawValue(element, {
        element,
        groupId: group.id || null,
        entryKey: entry.key || null,
        writer: panelState.writer,
        validator: panelState.validator
      });

      if (entry.key === 'flowable:assignee' && !toStr(value).trim()) {
        return DEFAULT_USER_TASK_ASSIGNEE;
      }

      return value;
    };
  }

  if (setRawValue) {
    entry.setValue = (value) => {
      const nextValue = typeof entry.normalizeValue === 'function' ? entry.normalizeValue(value) : value;
      if (uiState) {
        uiState.pendingSimpleEntry = {
          elementId: getElementId(element),
          entryKey: entry.key || null,
          value: toStr(nextValue)
        };
      }

      const result = writeProperties(element, context, entry.key, nextValue);
      if (uiState && (!result || !result.updated)) {
        uiState.pendingSimpleEntry = null;
      }

      return result;
    };
  }

  if (rawValidate) {
    entry.validate = (value) => rawValidate(value, {
      element,
      groupId: group.id || null,
      entryKey: entry.key || null,
      writer: panelState.writer,
      validator: panelState.validator
    });
  }

  return entry;
}

function bindBasicEntries(entry, group, element, options = {}) {
  writeDefaultProperties(element, options.context);

  createEntryAdapter(entry, group, options.panelState, element, options);
}

export default {
  bindBasicEntries
};
