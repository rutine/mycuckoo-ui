class CustomPalette {
  constructor(bpmnFactory, create, elementFactory, palette, translate) {
    this.bpmnFactory = bpmnFactory;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;

    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    const {bpmnFactory, create, elementFactory, translate} = this;

    function createTask() {
      return function (event) {
        const businessObject = bpmnFactory.create('bpmn:Task');
        businessObject['custom'] = 1
        const shape = elementFactory.createShape({type: 'bpmn:Task', businessObject});

        console.log(shape) // 只在拖动或者点击时触发
        create.start(event, shape);
      }
    }

    return {
      'create.cuckoo-task': {
        group: 'model',
        // className: 'bpmn-icon-task red',
        className: 'icon-custom cuckoo-task',
        title: translate('MyCuckoo任务节点'),
        action: {
          dragstart: createTask(),
          click: createTask()
        }
      }
    }
  }
}

CustomPalette.$inject = [
  'bpmnFactory',
  'create',
  'elementFactory',
  'palette',
  'translate'
]

// 不写index.js 直接导出
export default {
  __init__: ['customPalette'],
  customPalette: ['type', CustomPalette]
}