import {
  createPanelSetting,
  createPickerEntry,
  createSimpleEntry
} from './BasicSetting.js';

function getProperty(element, key) {
  const businessObject = element && element.businessObject ? element.businessObject : element;
  if (!businessObject) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(businessObject, key)) {
    return businessObject[key];
  }

  return typeof businessObject.get === 'function' ? businessObject.get(key) : undefined;
}

function createProperties(data) {
  const formKey = data && typeof data === 'object' ? data.id : data;
  const formName = data && typeof data === 'object' ? data.name : '';

  return {
    'flowable:formKey': formKey === '' ? undefined : formKey,
    'flowable:formName': formKey && formName ? formName : undefined
  };
}

export function createStartEventSetting(element, options = {}) {
  return createPanelSetting(element, [
    {
      id: 'base',
      label: '基本信息',
      entries: [
        createSimpleEntry('name', '节点名称'),
        createSimpleEntry('id', '节点ID')
      ]
    },
    {
      id: 'form',
      label: '表单配置',
      entries: [
        createPickerEntry('flowable:formKey', '表单', {
          emptyText: '未选择表单',
          pickValue: options.formPicker,
          getText: function() {
            return getProperty(element, 'flowable:formName') || '';
          },
          createProperties: createProperties
        })
      ]
    }
  ]);
}

export default createStartEventSetting;
