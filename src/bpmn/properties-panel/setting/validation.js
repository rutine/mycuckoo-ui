export const VALIDATOR_KIND = 'panel-validator';
export const VALIDATOR_STATUS = 'not-implemented';

function getGroupIds(setting) {
  return (setting && Array.isArray(setting.groups) ? setting.groups : []).map((group) => group.id);
}

function createValidationContext(setting, element) {
  return {
    elementId: element && element.id ? element.id : '',
    groupIds: getGroupIds(setting)
  };
}

function createDescriptor(type, element, payload = {}) {
  return {
    kind: type,
    status: VALIDATOR_STATUS,
    notImplemented: true,
    issues: [],
    element,
    ...payload
  };
}

function createGroupValidationDescriptor(element, groupId, values = {}) {
  return createDescriptor('panel-validate-group', element, {
    groupId,
    values
  });
}

export function createFieldValidationDescriptor(element, groupId, fieldId, value) {
  return createDescriptor('panel-validate-field', element, {
    groupId,
    fieldId,
    value
  });
}

export function createAllValidationDescriptor(element, values = {}) {
  return createDescriptor('panel-validate-all', element, {
    values
  });
}

export function createValidator(setting, element) {
  const context = createValidationContext(setting, element);

  const validator = {
    kind: VALIDATOR_KIND,
    groupIds: context.groupIds,
    notImplemented: true,
    describeFieldValidation(groupId, fieldId, value) {
      return createFieldValidationDescriptor(element, groupId, fieldId, value);
    },
    describeGroupValidation(groupId, values = {}) {
      return createGroupValidationDescriptor(element, groupId, values);
    },
    describeValidation(values = {}) {
      return createAllValidationDescriptor(element, values);
    },
    validateField(groupId, fieldId, value) {
      return createFieldValidationDescriptor(element, groupId, fieldId, value);
    },
    validateGroup(groupId, values = {}) {
      return createGroupValidationDescriptor(element, groupId, values);
    },
    validateAll(values = {}) {
      return createAllValidationDescriptor(element, values);
    }
  };

  Object.defineProperty(validator, 'context', {
    value: context,
    enumerable: false
  });

  return validator;
}

export default createValidator;
