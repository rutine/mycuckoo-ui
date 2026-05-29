import { getParametersElement, readModdleProperty } from '../../util.js';
import {
  normalizeString,
  trimValue
} from './shared.js';

function normalizeExtension(extension = {}) {
  return {
    key: normalizeString(extension.key)
  };
}

function getExtensionsElement(parameter) {
  return readModdleProperty(parameter, 'extensions');
}

export function listExtensions(element) {
  const parametersElement = getParametersElement(element, 'taskExt:Parameters');
  const parameters = readModdleProperty(parametersElement, 'values');

  if (!Array.isArray(parameters)) {
    return [];
  }

  return parameters.flatMap((parameter, parameterIndex) => {
    const extensionsElement = getExtensionsElement(parameter);
    const extensions = readModdleProperty(extensionsElement, 'extensions');

    if (!Array.isArray(extensions)) {
      return [];
    }

    return extensions.map((extension, extensionIndex) => ({
      parameterIndex,
      parameterName: normalizeString(readModdleProperty(parameter, 'name')),
      extensionIndex,
      ...normalizeExtension({
        key: readModdleProperty(extension, 'key')
      })
    }));
  });
}

export function createDefaultExtension() {
  return {
    key: ''
  };
}

export function uniqueKeys(extensions = []) {
  const normalizedExtensions = Array.isArray(extensions)
    ? extensions.map((extension) => normalizeExtension(extension))
    : [];
  const keyIndexes = new Map();

  normalizedExtensions.forEach((extension, index) => {
    const key = trimValue(extension.key);

    if (!key) {
      return;
    }

    if (!keyIndexes.has(key)) {
      keyIndexes.set(key, []);
    }

    keyIndexes.get(key).push(index);
  });

  const issues = [];

  keyIndexes.forEach((indexes, key) => {
    if (indexes.length < 2) {
      return;
    }

    issues.push({
      code: 'duplicate-key',
      indexes,
      key,
      message: 'extension key must be unique'
    });
  });

  return {
    valid: issues.length === 0,
    duplicateKeys: issues.map((issue) => issue.key),
    issues,
    extensions: normalizedExtensions
  };
}

export const validators = {
  uniqueKeys
};

export function createValue(element) {
  const normalizedItems = listExtensions(element);

  return {
    kind: 'extension-editor',
    scope: 'parameter',
    items: normalizedItems,
    draft: createDefaultExtension(),
    createDefaultExtension,
    validators
  };
}

export default {
  createDefaultExtension,
  createValue,
  listExtensions,
  validators
};
