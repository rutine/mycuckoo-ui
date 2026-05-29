export function normalizeString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function trimValue(value) {
  return normalizeString(value).trim();
}

export function createValidationResult(errors = {}, payloadKey, payload) {
  const result = {
    valid: Object.keys(errors).length === 0,
    errors,
    issues: Object.keys(errors).map((field) => ({
      field,
      message: errors[field]
    }))
  };

  if (payloadKey) {
    result[payloadKey] = payload;
  }

  return result;
}

export function executeCommands(commandStack, commands = []) {
  if (!commandStack || !Array.isArray(commands) || !commands.length) {
    return undefined;
  }

  if (commands.length === 1) {
    return commandStack.execute(commands[0].cmd, commands[0].context);
  }

  try {
    return commandStack.execute('properties-panel.multi-command-executor', commands);
  } catch (error) {
    let lastResult;

    commands.forEach((command) => {
      lastResult = commandStack.execute(command.cmd, command.context);
    });

    return lastResult;
  }
}
