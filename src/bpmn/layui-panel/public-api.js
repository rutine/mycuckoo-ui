import { resolvePanelSchema } from './schema/index.js';
import extensions from './editors/extension-editor.js';
import listeners from './editors/listener-editor.js';
import multiInstance from './editors/multi-instance-editor.js';
import parameters from './editors/parameter-editor.js';
import {
  appendTaskParameter,
  updateSequenceFlowConditionExpression,
  updateTaskParameter
} from './services/extensions.js';
import {
  findGroupEntry,
  getElementId,
  normalizeText
} from './utils.js';

const DEFAULT_USER_TASK_ASSIGNEE = '${assignee}';

function normalizeMultiInstanceState(draft = {}) {
  return {
    enabled: !!draft.enabled,
    isSequential: !!draft.isSequential,
    collection: normalizeText(draft.collection).trim(),
    elementVariable: normalizeText(draft.elementVariable).trim(),
    loopCardinality: normalizeText(draft.loopCardinality).trim(),
    completionCondition: normalizeText(draft.completionCondition).trim(),
    assigneeMode: normalizeText(draft.assigneeMode).trim(),
    ids: normalizeText(draft.ids).trim(),
    names: normalizeText(draft.names).trim()
  };
}

function isSameMultiInstanceState(left, right) {
  const nextLeft = normalizeMultiInstanceState(left);
  const nextRight = normalizeMultiInstanceState(right);

  return JSON.stringify(nextLeft) === JSON.stringify(nextRight);
}

function readBusinessObjectValue(element, key) {
  const businessObject = element && element.businessObject ? element.businessObject : null;

  if (!businessObject || !key) {
    return '';
  }

  if (Object.prototype.hasOwnProperty.call(businessObject, key)) {
    return normalizeText(businessObject[key]);
  }

  if (typeof businessObject.get === 'function') {
    return normalizeText(businessObject.get(key));
  }

  return '';
}

function ensureDefaultUserTaskProperties(element, services) {
  if (!element || element.type !== 'bpmn:UserTask' || !services || !services.modeling) {
    return;
  }

  if (!readBusinessObjectValue(element, 'flowable:assignee').trim()) {
    services.modeling.updateProperties(element, {
      'flowable:assignee': DEFAULT_USER_TASK_ASSIGNEE
    });
  }
}

function writeSimpleField(element, services, fieldId, value) {
  if (!element || !services || !services.modeling || !fieldId) {
    return {
      updated: false,
      notApplied: true,
      reason: 'missing-services'
    };
  }

  const nextValue = normalizeText(value);

  return {
    updated: true,
    result: services.modeling.updateProperties(element, {
      [fieldId]: nextValue || undefined
    })
  };
}

function getPanelEntry(panelState, groupId, entryKey) {
  return findGroupEntry(panelState, groupId, entryKey);
}

function bindPanelEntry(panelState, groupId, entryKey, binder) {
  const entry = getPanelEntry(panelState, groupId, entryKey);

  if (!entry || typeof binder !== 'function') {
    return panelState;
  }

  binder(entry);

  return panelState;
}

function unwrapDraftValue(value) {
  return value && value.draft ? value.draft : value;
}

function unwrapItemsValue(value) {
  return Array.isArray(value) ? value : value && value.items;
}

function bindDefaultEntries(panelState, element, options = {}) {
  const groups = panelState && Array.isArray(panelState.groups) ? panelState.groups : [];
  const services = options.services || null;
  const uiState = options.uiState || null;

  groups.forEach((group) => {
    const entries = group && Array.isArray(group.entries) ? group.entries : [];

    entries.forEach((entry) => {
      if (!entry) {
        return;
      }

      const originalGetValue = typeof entry.getValue === 'function' ? entry.getValue : null;
      const originalSetValue = typeof entry.setValue === 'function' ? entry.setValue : null;
      const originalValidate = typeof entry.validate === 'function' ? entry.validate : null;

      if (originalGetValue) {
        entry.getValue = () => {
          const value = originalGetValue(element, {
            element,
            groupId: group.id || null,
            entryKey: entry.key || null,
            writer: panelState.writer,
            validator: panelState.validator
          });

          if (entry.key === 'flowable:assignee' && !normalizeText(value).trim()) {
            return DEFAULT_USER_TASK_ASSIGNEE;
          }

          return value;
        };
      }

      if (originalSetValue) {
        entry.setValue = (value) => {
          if (entry.component === 'TextInput' || entry.component === 'ExpressionEditor') {
            if (uiState) {
              uiState.pendingSimpleEntry = {
                elementId: getElementId(element),
                entryKey: entry.key || null,
                value: normalizeText(value)
              };
            }

            const result = writeSimpleField(element, services, entry.key, value);

            if (uiState && (!result || !result.updated)) {
              uiState.pendingSimpleEntry = null;
            }

            return result;
          }

          return originalSetValue(value, {
            element,
            groupId: group.id || null,
            entryKey: entry.key || null,
            writer: panelState.writer,
            validator: panelState.validator
          });
        };
      }

      if (originalValidate) {
        entry.validate = (value) => originalValidate(value, {
          element,
          groupId: group.id || null,
          entryKey: entry.key || null,
          writer: panelState.writer,
          validator: panelState.validator
        });
      }
    });
  });

  return panelState;
}

function bindMultiInstanceEntry(panelState, element, options = {}) {
  const services = options.services || null;
  const userPicker = typeof options.userPicker === 'function' ? options.userPicker : null;
  const uiState = options.uiState || null;

  return bindPanelEntry(panelState, 'multi-instance', 'multiInstanceEditor', (entry) => {
    entry.getValue = () => {
      const derivedDraft = multiInstance.deriveDraft(element);
      const pendingDraft = uiState && uiState.pendingMultiInstanceDraft;

      if (!pendingDraft || pendingDraft.elementId !== getElementId(element)) {
        return derivedDraft;
      }

      if (isSameMultiInstanceState(derivedDraft, pendingDraft.draft)) {
        uiState.pendingMultiInstanceDraft = null;
        return derivedDraft;
      }

      return pendingDraft.draft;
    };
    entry.validate = (draft) => multiInstance.validateDraft(draft);
    entry.pickUsers = (draft = {}) => {
      if (!userPicker) {
        return null;
      }

      return userPicker({
        element,
        draft,
        groupId: 'multi-instance',
        entryKey: entry.key || null
      });
    };
    entry.setValue = (draft) => {
      if (uiState) {
        uiState.pendingMultiInstanceDraft = {
          elementId: getElementId(element),
          draft: normalizeMultiInstanceState(draft)
        };
        uiState.suppressMultiInstanceRender = {
          elementId: getElementId(element),
          remaining: 6
        };
      }

      if (!services) {
        return {
          updated: false,
          notApplied: true,
          reason: 'missing-services',
          validation: multiInstance.validateDraft(draft)
        };
      }

      const result = multiInstance.applyDraft(services, element, draft);

      if (uiState && (!result || !result.updated)) {
        uiState.pendingMultiInstanceDraft = null;
      }

      return result;
    };
  });
}

function bindListenerEntry(panelState, element, options = {}) {
  const services = options.services || null;
  const uiState = options.uiState || null;
  const listenerSelectMode = options.listenerSelectMode === 'layui' ? 'layui' : 'native';

  return bindPanelEntry(panelState, 'listeners', 'listenerEditor', (entry) => {
    entry.getValue = () => listeners.createValue(element);
    entry.validate = (value = {}) => listeners.validateDraft(unwrapDraftValue(value));
    entry.ui = {
      ...(entry.ui || {}),
      selectMode: listenerSelectMode
    };
    entry.setValue = (value = {}) => {
      const shouldRestoreFocus = value && value.action === 'add' && uiState;

      if (shouldRestoreFocus) {
        uiState.pendingFocus = {
          kind: 'listener-value-last',
          elementId: getElementId(element)
        };
      }

      const result = listeners.applyChange(services, element, value);

      if (shouldRestoreFocus && (!result || !result.updated)) {
        uiState.pendingFocus = null;
      }

      return result;
    };
  });
}

function bindExtensionEntry(panelState, element) {
  return bindPanelEntry(panelState, 'parameters', 'extensionEditor', (entry) => {
    entry.getValue = () => extensions.createValue(element);
    entry.validate = (value = {}) => extensions.validators.uniqueKeys(unwrapItemsValue(value));
    entry.setValue = (value = {}) => ({
      updated: false,
      notApplied: true,
      reason: 'extension-editor-write-not-implemented',
      validation: extensions.validators.uniqueKeys(unwrapItemsValue(value))
    });
  });
}

function bindParameterEntry(panelState, element, options = {}) {
  const services = options.services || null;

  return bindPanelEntry(panelState, 'parameters', 'parameterEditor', (entry) => {
    entry.getValue = () => parameters.createValue(element);
    entry.validate = (value = {}) => parameters.validateParameter(unwrapDraftValue(value));
    entry.setValue = (value = {}) => {
      const nextValue = unwrapDraftValue(value);
      const validation = parameters.validateParameter(nextValue);
      const nextIndex = Number.isInteger(value && value.index)
        ? value.index
        : (Number.isInteger(nextValue && nextValue.index) ? nextValue.index : null);

      if (!validation.valid) {
        return {
          updated: false,
          validation
        };
      }

      if (!services) {
        return {
          updated: false,
          notApplied: true,
          reason: 'missing-services',
          validation
        };
      }

      const result = nextIndex === null
        ? appendTaskParameter(services, element, validation.parameter)
        : updateTaskParameter(services, element, nextIndex, validation.parameter);

      return {
        ...result,
        validation
      };
    };
  });
}

function bindSequenceFlowConditionEntry(panelState, element, options = {}) {
  const services = options.services || null;

  return bindPanelEntry(panelState, 'flow-condition', 'conditionExpression', (entry) => {
    entry.getValue = () => {
      const businessObject = element && element.businessObject ? element.businessObject : null;
      const conditionExpression = businessObject && (
        businessObject.conditionExpression || (
          typeof businessObject.get === 'function' ? businessObject.get('conditionExpression') : null
        )
      );

      if (!conditionExpression) {
        return '';
      }

      return conditionExpression.body || conditionExpression.value || '';
    };
    entry.setValue = (value = '') => updateSequenceFlowConditionExpression(services, element, value);
  });
}

export function resolvePanelState(element, options = {}) {
  ensureDefaultUserTaskProperties(element, options.services || null);
  const panelState = resolvePanelSchema(element);

  bindDefaultEntries(panelState, element, options);
  bindMultiInstanceEntry(panelState, element, options);
  bindListenerEntry(panelState, element, options);
  bindExtensionEntry(panelState, element);
  bindParameterEntry(panelState, element, options);
  bindSequenceFlowConditionEntry(panelState, element, options);

  return panelState;
}

export default {
  moduleName: 'layuiPropertiesPanel',
  resolvePanelState,
  listeners,
  extensions,
  multiInstance,
  parameters
};
