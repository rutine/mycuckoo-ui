import { getParametersElement, readModdleProperty } from '../../util.js';
import {
  createValidationResult,
  normalizeString,
  trimValue
} from './shared.js';

function normalizeParameter(parameter = {}) {
  return {
    name: normalizeString(parameter.name),
    value: normalizeString(parameter.value)
  };
}

export function createDefaultParameter(name = 'Parameter_0') {
  return {
    name: normalizeString(name, 'Parameter_0') || 'Parameter_0',
    value: ''
  };
}

export function listParameters(element) {
  const parametersElement = getParametersElement(element, 'taskExt:Parameters');
  const parameters = readModdleProperty(parametersElement, 'values');

  if (!Array.isArray(parameters)) {
    return [];
  }

  return parameters.map((parameter, index) => ({
    index,
    ...normalizeParameter({
      name: readModdleProperty(parameter, 'name'),
      value: readModdleProperty(parameter, 'value')
    })
  }));
}

export function validateParameter(parameter = {}) {
  const normalizedParameter = normalizeParameter(parameter);
  const errors = {};

  if (!trimValue(normalizedParameter.name)) {
    errors.name = 'name is required';
  }

  return createValidationResult(errors, 'parameter', normalizedParameter);
}

export function createValue(element) {
  return {
    kind: 'parameter-editor',
    items: listParameters(element),
    draft: createDefaultParameter(),
    createDefaultParameter,
    validateParameter
  };
}

export default {
  createDefaultParameter,
  createValue,
  listParameters,
  validateParameter
};
