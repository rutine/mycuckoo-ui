import {toStr} from './utils.js';

function firstErrorValueMessage(errors) {
  if (!errors || typeof errors !== 'object') {
    return '';
  }

  const values = Object.values(errors);

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (typeof value === 'string' && value) {
      return value;
    }

    if (value && typeof value.message === 'string' && value.message) {
      return value.message;
    }
  }

  return '';
}

export function firstValidationMessage(result) {
  if (!result) {
    return '';
  }

  if (typeof result === 'string') {
    return result;
  }

  if (result.valid === false) {
    if (typeof result.message === 'string' && result.message) {
      return result.message;
    }

    const errorMessage = firstErrorValueMessage(result.errors);

    return errorMessage || '输入不合法';
  }

  return '';
}

export function getFieldValidationMessage(validation, field) {
  if (!validation || typeof validation !== 'object') {
    return '';
  }

  const errors = validation.errors;

  if (!errors || typeof errors !== 'object') {
    return '';
  }

  const target = errors[field];

  if (typeof target === 'string' && target) {
    return target;
  }

  if (target && typeof target.message === 'string' && target.message) {
    return target.message;
  }

  return '';
}

export function setControlError(controlEl, errorEl, message) {
  const nextMessage = toStr(message).trim();
  const hasDangerClass = /\blayui-form-danger\b/.test(controlEl.className);

  errorEl.textContent = nextMessage;

  if (nextMessage && !hasDangerClass) {
    controlEl.className = `${controlEl.className} layui-form-danger`.trim();
    return;
  }

  if (!nextMessage && hasDangerClass) {
    controlEl.className = controlEl.className.replace(/\s*layui-form-danger\b/g, '').trim();
  }
}
