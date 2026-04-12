import { is } from 'bpmn/lib/util/ModelUtil';
import sequenceFlowProps from './parts/SequenceFlowProps';
import userTaskProps from './task/UserTaskProps';
import { getMultiInstanceEntries } from './task/MultiInstancesProps';

const LOW_PRIORITY = 500;

/**
 * 自定义属性面板提供者，通过 `#getGroups(element)` 暴露分组配置。
 *
 * @param {PropertiesPanel} propertiesPanel
 * @param {Function} translate
 */
export default function UserPropertiesProvider(propertiesPanel, injector, translate) {
  /**
   * 返回指定元素的属性分组。
   *
   * @param {DiagramElement} element
   *
   * @return {(Object[]) => (Object[])} 分组处理中间件
   */
  this.getGroups = function(element) {

    /**
     * 返回一个中间件，用于补充分组配置。
     *
     * @param {Object[]} groups
     *
     * @return {Object[]} 处理后的分组列表
     */
    return function(groups) {
      if (is(element, 'bpmn:Task')) {
        groups = updateMultiInstanceGroup(groups, element, translate);
        groups.push(createUserTaskGroup(element, injector, translate));
      } else if (is(element, 'bpmn:SequenceFlow')) {
        groups.push(createGroup(element, translate));
      }

      return groups;
    };
  };

  // 在默认 BPMN 属性提供者之后注册自定义提供者
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
}

UserPropertiesProvider.$inject = [ 'propertiesPanel', 'injector', 'translate' ];

// 创建自定义连线分组
function createGroup(element, translate) {
  const myGroup = {
    id: 'flow',
    label: translate('Expression'),
    entries: sequenceFlowProps(element),
    tooltip: translate('Expression')
  };

  return myGroup;
}

function createUserTaskGroup(element, injector, translate) {
  const parametersGroup = {
    id: 'userTask',
    label: translate('User'),
    entries: userTaskProps({ element, injector })
  };

  return parametersGroup;
}

function updateMultiInstanceGroup(groups, element, translate) {
  const multiInstanceEntries = getMultiInstanceEntries({
    parentId: element.id,
    element
  });
  const multiInstanceGroup = groups.find((group) => group.id === 'multiInstance');

  if (multiInstanceGroup) {
    multiInstanceGroup.entries = multiInstanceEntries;

    return groups;
  }

  return groups.concat({
    id: 'multiInstance',
    label: translate('Multi-instance'),
    entries: multiInstanceEntries
  });
}
