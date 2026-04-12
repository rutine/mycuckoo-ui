import { isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { getBusinessObject, is } from 'bpmn/lib/util/ModelUtil';

import { createElement, getNumericSuffix, getTaskIndexFromElement } from '../../../util';

export default function(element) {
  return [
    {
      id: 'expression',
      element,
      component: MyEntry,
      isEdited: isTextFieldEntryEdited
    }
  ];
}

function resolveSequenceIndex(element) {
  const businessObject = getBusinessObject(element);
  const targetRef = businessObject.targetRef;
  const sourceRef = businessObject.sourceRef;

  if (targetRef && is(targetRef, 'bpmn:Task')) {
    const taskIndex = getTaskIndexFromElement(targetRef);

    return {
      enabled: taskIndex !== null,
      index: taskIndex,
      reverse: false
    };
  }

  const shortOutIndex = getNumericSuffix(sourceRef && sourceRef.id, 'shortOutGateway_');

  if (shortOutIndex !== null && targetRef
    && (is(targetRef, 'bpmn:ExclusiveGateway') || is(targetRef, 'bpmn:EndEvent'))) {
    return {
      enabled: true,
      index: shortOutIndex,
      reverse: true
    };
  }

  return {
    enabled: false,
    index: null,
    reverse: false
  };
}

function MyEntry(props) {
  const { element, id } = props;
  const bpmnFactory = useService('bpmnFactory');
  const commandStack = useService('commandStack');
  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  function getDefaultConditionBody(currentElement) {
    const { enabled, index, reverse } = resolveSequenceIndex(currentElement);

    if (enabled) {
      const listName = `assigneeList_${index}`;

      return reverse
        ? `\${${listName} == null || ${listName}.size() == 0}`
        : `\${${listName} != null && ${listName}.size() > 0}`;
    }

    return null;
  }

  function ensureConditionExpression(currentElement) {
    const businessObject = getBusinessObject(currentElement);
    let conditionExpression = businessObject.get('conditionExpression');
    const defaultBody = getDefaultConditionBody(currentElement);

    if (!defaultBody) {
      return conditionExpression;
    }

    if (!conditionExpression) {
      conditionExpression = createElement('bpmn:FormalExpression', {
        body: defaultBody
      }, businessObject, bpmnFactory);

      modeling.updateProperties(currentElement, { conditionExpression });
    }

    return conditionExpression;
  }

  const getValue = (currentElement) => {
    if (!getDefaultConditionBody(currentElement)) {
      return '';
    }

    const conditionExpression = ensureConditionExpression(currentElement);

    return conditionExpression ? conditionExpression.body || '' : '';
  };

  const setValue = (value) => {
    if (!getDefaultConditionBody(element)) {
      return;
    }

    const conditionExpression = ensureConditionExpression(element);

    if (!conditionExpression) {
      return;
    }

    return commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: conditionExpression,
      properties: {
        body: value
      }
    });
  };

  return TextFieldEntry({
    id,
    element,
    label: translate('Expression'),
    getValue,
    setValue,
    debounce,
    disabled: !getDefaultConditionBody(element),
    description: '',
    tooltip: translate('Expression')
  });
}
