import {escapeAttr, escapeHtml, renderHtml} from "../common/html";
import {renderGroup} from './ComponentRender.js';
import resolvePanelSetting from "../setting";


function groupUI(groups = []) {
  return `<div class="layui-collapse layui-bpmn-panel__groups">
    ${groups.map((group, index) => {
        const label = group.label || group.id || '';
        const className = group.error ? 'layui-colla-title layui-bpmn-panel__group-title--error' : 'layui-colla-title';
        const errorHtml = !group.error ? ''
            : `<span class="layui-bpmn-panel__group-error">${escapeHtml(group.error || '')}</span>`;

        return `<div class="layui-colla-item" data-group-index="${index}" data-group-id="${escapeAttr(group.id || '')}">
                <h2 class="${escapeAttr(className)}">${escapeHtml(label)}${errorHtml}</h2>
                <div class="layui-bpmn-panel__group-mount"></div>
                </div>`
      }).join('')}
    </div>`;
}

function ui(panelState) {
  const title = panelState && panelState.title ? panelState.title : '';
  const elementType = panelState && panelState.elementType ? panelState.elementType : '';
  const bodyHtml = !!elementType ? groupUI(panelState.groups || [])
      : `<div class="layui-bpmn-panel__empty layui-text">${escapeHtml(title || '未选择节点')}</div>`;

  return `
    <form class="layui-form layui-form-pane layui-bpmn-panel">
        <fieldset class="layui-elem-field layui-field-title layui-bpmn-panel__header">
        <legend class="layui-bpmn-panel__title">${escapeHtml(title)}</legend>
        <div class="layui-bpmn-panel__type">${escapeHtml(elementType)}</div>
        </fieldset>
        <div class="layui-bpmn-panel__body">${bodyHtml}</div>
    </form>
  `;
}


export default class PropertiesProvider {
  constructor(container) {
    this._container = container || null;
  }

  render(element, options = {}) {
    if (!this._container) {
      return null;
    }

    const panelState = resolvePanelSetting(element, options);

    const _options = {
      context: options.context || null,
      uiState: options.uiState || null,
      panelState: panelState || null,
      userPicker: options.userPicker,
      listenerSelectMode: options.listenerSelectMode
    };

    renderHtml(this._container, ui(panelState));

    (panelState.groups || []).forEach((group, index) => {
      const groupEl = this._container.querySelector(`[data-group-index="${index}"]`);
      const groupMountEl = groupEl && groupEl.querySelector('.layui-bpmn-panel__group-mount');
      if (groupMountEl) {
        groupMountEl.replaceWith(renderGroup(group, element, _options));
      }
    });

    return panelState;
  }
}
