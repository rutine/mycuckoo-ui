import { renderFieldGroup } from './fields.js';

function getGroupErrorText(group) {
  if (!group || !group.error) {
    return '';
  }

  return typeof group.error === 'string' ? group.error : '存在校验错误';
}

export function renderPanel(container, panelState) {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'layui-form layui-form-pane layui-bpmn-panel';

  const header = document.createElement('fieldset');
  header.className = 'layui-elem-field layui-field-title layui-bpmn-panel__header';

  const titleEl = document.createElement('legend');
  titleEl.className = 'layui-bpmn-panel__title';
  titleEl.textContent = panelState.title || '';
  header.appendChild(titleEl);

  const typeEl = document.createElement('div');
  typeEl.className = 'layui-bpmn-panel__type';
  typeEl.textContent = panelState.elementType || '';
  header.appendChild(typeEl);

  form.appendChild(header);

  const body = document.createElement('div');
  body.className = 'layui-bpmn-panel__body';

  if (!panelState.elementType) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'layui-bpmn-panel__empty layui-text';
    emptyEl.textContent = panelState.title || '未选择节点';

    body.appendChild(emptyEl);
  } else {
    const groupsEl = document.createElement('div');
    groupsEl.className = 'layui-collapse layui-bpmn-panel__groups';

    (panelState.groups || []).forEach((group) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'layui-colla-item';
      groupEl.dataset.groupId = group.id || '';

      const groupTitleEl = document.createElement('h2');
      groupTitleEl.className = 'layui-colla-title';
      groupTitleEl.textContent = group.label || group.id || '';

      const groupErrorText = getGroupErrorText(group);

      if (groupErrorText) {
        groupTitleEl.className += ' layui-bpmn-panel__group-title--error';

        const groupErrorEl = document.createElement('span');
        groupErrorEl.className = 'layui-bpmn-panel__group-error';
        groupErrorEl.textContent = groupErrorText;
        groupTitleEl.appendChild(groupErrorEl);
      }

      groupEl.appendChild(groupTitleEl);
      groupEl.appendChild(renderFieldGroup(group));
      groupsEl.appendChild(groupEl);
    });

    body.appendChild(groupsEl);
  }

  form.appendChild(body);
  container.appendChild(form);
}

export default renderPanel;
