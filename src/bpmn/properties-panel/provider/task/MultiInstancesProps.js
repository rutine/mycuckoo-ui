import { CheckboxEntry, TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { getBusinessObject } from 'bpmn/lib/util/ModelUtil';

import { createElement, getTaskIndexFromElement } from '../../../util';

export function getMultiInstanceEntries(props) {
  const { parentId, element } = props;
  const multiInstanceEnabled = hasMultiInstanceElement(element);
  const entries = [{
    id: parentId + '_sequential_' + (multiInstanceEnabled ? 'on' : 'off'),
    component: SequentialMultiInstance,
    parentId
  }, {
    id: parentId + '_collection_' + (multiInstanceEnabled ? 'on' : 'off'),
    component: Collection,
    parentId
  }, {
    id: parentId + '_elementVariable_' + (multiInstanceEnabled ? 'on' : 'off'),
    component: ElementVariable,
    parentId
  }, {
    id: parentId + '_loopCardinality_' + (multiInstanceEnabled ? 'on' : 'off'),
    component: LoopCardinality,
    parentId
  }, {
    id: parentId + '_completionCondition_' + (multiInstanceEnabled ? 'on' : 'off'),
    component: CompletionCondition,
    parentId
  }];

  return entries;
}

function getTaskIndex(element) {
  return getTaskIndexFromElement(element);
}

function getDefaultCollectionValue(element) {
  const taskIndex = getTaskIndex(element);

  return taskIndex === null ? '' : `assigneeList_${taskIndex}`;
}

function hasMultiInstanceElement(element) {
  const businessObject = getBusinessObject(element);

  return !!businessObject.get('loopCharacteristics');
}

function SequentialMultiInstance(props) {
  const { parentId, element } = props;
  const bpmnFactory = useService('bpmnFactory');
  const moddle = useService('moddle');
  const modeling = useService('modeling');
  const debounce = useService('debounceInput');
  const eventBus = useService('eventBus');

  const getValue = (currentElement) => {
    const businessObject = getBusinessObject(currentElement);
    const multiInstanceLoopElement = businessObject.get('loopCharacteristics');

    if (!multiInstanceLoopElement) {
      return false;
    }

    return multiInstanceLoopElement.isSequential === true || multiInstanceLoopElement.isSequential === 'true';
  };

  const setValue = (value) => {
    const multiInstanceElement = ensureMultiInstanceElement({
      element,
      bpmnFactory,
      moddle,
      modeling
    });

    if (!multiInstanceElement) {
      return;
    }

    multiInstanceElement.isSequential = !!value;

    const result = modeling.updateProperties(element, { loopCharacteristics: multiInstanceElement });

    eventBus.fire('propertiesPanel.providersChanged');

    return result;
  };

  return CheckboxEntry({
    id: parentId + '_sequentialValue',
    element,
    label: '是否串行多实例',
    getValue,
    setValue,
    debounce
  });
}

function Collection(props) {
  const { parentId, element } = props;
  const bpmnFactory = useService('bpmnFactory');
  const moddle = useService('moddle');
  const modeling = useService('modeling');
  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');
  const translate = useService('translate');

  const getValue = (currentElement) => {
    const businessObject = getBusinessObject(currentElement);
    const multiInstanceElement = businessObject.get('loopCharacteristics');

    return multiInstanceElement ? multiInstanceElement.get('flowable:collection') || '' : getDefaultCollectionValue(currentElement);
  };

  const setValue = (value) => {
    const multiInstanceElement = ensureMultiInstanceElement({
      element,
      bpmnFactory,
      moddle,
      modeling
    });

    if (!multiInstanceElement) {
      return;
    }

    return commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: multiInstanceElement,
      properties: {
        'flowable:collection': value || undefined
      }
    });
  };

  return TextFieldEntry({
    id: parentId + '_collectionValue',
    element,
    label: translate('Collection'),
    getValue,
    setValue,
    debounce
  });
}

function ElementVariable(props) {
  const { parentId, element } = props;
  const bpmnFactory = useService('bpmnFactory');
  const moddle = useService('moddle');
  const modeling = useService('modeling');
  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');
  const translate = useService('translate');

  const getValue = (currentElement) => {
    const businessObject = getBusinessObject(currentElement);
    const multiInstanceElement = businessObject.get('loopCharacteristics');

    return multiInstanceElement ? multiInstanceElement.get('flowable:elementVariable') || '' : 'assignee';
  };

  const setValue = (value) => {
    const multiInstanceElement = ensureMultiInstanceElement({
      element,
      bpmnFactory,
      moddle,
      modeling
    });

    if (!multiInstanceElement) {
      return;
    }

    return commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: multiInstanceElement,
      properties: {
        'flowable:elementVariable': value || undefined
      }
    });
  };

  return TextFieldEntry({
    id: parentId + '_elementVariableValue',
    element,
    label: translate('Element Variable'),
    getValue,
    setValue,
    debounce
  });
}

function LoopCardinality(props) {
  const { parentId, element } = props;
  const bpmnFactory = useService('bpmnFactory');
  const moddle = useService('moddle');
  const modeling = useService('modeling');
  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');
  const translate = useService('translate');

  const getValue = (currentElement) => {
    const businessObject = getBusinessObject(currentElement);
    const multiInstanceElement = businessObject.get('loopCharacteristics');
    const loopCardinality = multiInstanceElement && multiInstanceElement.get('loopCardinality');

    return loopCardinality ? loopCardinality.body || '' : '';
  };

  const setValue = (value) => {
    const multiInstanceElement = ensureMultiInstanceElement({
      element,
      bpmnFactory,
      moddle,
      modeling
    });

    if (!multiInstanceElement) {
      return;
    }

    const nextValue = value || undefined;
    let loopCardinality = multiInstanceElement.get('loopCardinality');

    if (!loopCardinality) {
      if (!nextValue) {
        return;
      }

      loopCardinality = moddle.create('bpmn:FormalExpression', {
        body: nextValue
      });

      return commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: multiInstanceElement,
        properties: {
          loopCardinality
        }
      });
    }

    return commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: loopCardinality,
      properties: {
        body: nextValue
      }
    });
  };

  return TextFieldEntry({
    id: parentId + '_loopCardinalityValue',
    element,
    label: translate('Loop cardinality'),
    getValue,
    setValue,
    debounce
  });
}

function CompletionCondition(props) {
  const { parentId, element } = props;
  const bpmnFactory = useService('bpmnFactory');
  const moddle = useService('moddle');
  const modeling = useService('modeling');
  const commandStack = useService('commandStack');
  const debounce = useService('debounceInput');
  const translate = useService('translate');

  const getValue = (currentElement) => {
    const businessObject = getBusinessObject(currentElement);
    const multiInstanceElement = businessObject.get('loopCharacteristics');
    const completionCondition = multiInstanceElement && multiInstanceElement.get('completionCondition');

    return completionCondition ? completionCondition.body || '' : '${auditFlowService.hasComplete(execution)}';
  };

  const setValue = (value) => {
    const multiInstanceElement = ensureMultiInstanceElement({
      element,
      bpmnFactory,
      moddle,
      modeling
    });

    if (!multiInstanceElement) {
      return;
    }

    const nextValue = value || undefined;
    let completionCondition = multiInstanceElement.get('completionCondition');

    if (!completionCondition) {
      if (!nextValue) {
        return;
      }

      completionCondition = moddle.create('bpmn:FormalExpression', {
        body: nextValue
      });

      return commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: multiInstanceElement,
        properties: {
          completionCondition
        }
      });
    }

    return commandStack.execute('element.updateModdleProperties', {
      element,
      moddleElement: completionCondition,
      properties: {
        body: nextValue
      }
    });
  };

  return TextFieldEntry({
    id: parentId + '_completionConditionValue',
    element,
    label: translate('Completion condition'),
    getValue,
    setValue,
    debounce
  });
}

export function ensureMultiInstanceElement({ element, bpmnFactory, moddle, modeling }) {
  const businessObject = getBusinessObject(element);
  let multiInstanceElement = businessObject.get('loopCharacteristics');
  const taskIndex = getTaskIndex(element);

  if (taskIndex === null) {
    return null;
  }

  if (!multiInstanceElement) {
    multiInstanceElement = createElement('bpmn:MultiInstanceLoopCharacteristics', {
      isSequential: false,
      'flowable:collection': `assigneeList_${taskIndex}`,
      'flowable:elementVariable': 'assignee',
      completionCondition: moddle.create('bpmn:FormalExpression', {
        body: '${auditFlowService.hasComplete(execution)}'
      })
    }, businessObject, bpmnFactory);

    multiInstanceElement.set('flowable:collection', `assigneeList_${taskIndex}`);
    multiInstanceElement.set('flowable:elementVariable', 'assignee');

    modeling.updateProperties(element, { loopCharacteristics: multiInstanceElement });
  }

  if (!multiInstanceElement.get('flowable:collection')) {
    multiInstanceElement.set('flowable:collection', `assigneeList_${taskIndex}`);
  }

  if (!multiInstanceElement.get('flowable:elementVariable')) {
    multiInstanceElement.set('flowable:elementVariable', 'assignee');
  }

  return multiInstanceElement;
}
