import CustomXML from './CustomXML';

const SUITABILITY_PROCESS_PRICE = "PROCESS_PRICE",
      SUITABILITY_FETCH_PRICE = "FETCH_PRICE",
      SUITABILITY_SHOPPING_FLOW = "SHOPPING_FLOW",
      FETCH_PRICE_DISPLAY_NAME = "Fetch Price",
      PROCESS_PRICE_DISPLAY_NAME = "Process Price";

export default class CustomContextPad {
  constructor(bpmnFactory, config, contextPad, create, elementFactory, injector, translate) {
    this.bpmnFactory = bpmnFactory;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;

    if (config.autoPlace !== false) {
      this.autoPlace = injector.get('autoPlace', false);
    }

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    const {
      autoPlace,
      bpmnFactory,
      create,
      elementFactory,
      translate
    } = this;

    function appendServiceTask(customElementName) {
      return function(event, element) {
        if (autoPlace) {
          const businessObject = bpmnFactory.create('bpmn:Task');
    
          //businessObject.ioSpecification = CustomXML.getIOSpecification(bpmnFactory, customElementName);
          //businessObject.dataInputAssociation = CustomXML.getInpAssociation(bpmnFactory, true);
          businessObject.customElementName = customElementName;
          businessObject.name = (customElementName == SUITABILITY_FETCH_PRICE ? FETCH_PRICE_DISPLAY_NAME : PROCESS_PRICE_DISPLAY_NAME);

          const shape = elementFactory.createShape({
            type: 'bpmn:Task',
            businessObject: businessObject
          });
    
          autoPlace.append(element, shape);
        } else {
          appendServiceTaskStart(event, element);
        }
      }
    }

    function appendServiceTaskStart(suitabilityScore) {
      return function(event) {
        const businessObject = bpmnFactory.create('bpmn:Task');

        businessObject.customElementName = suitabilityScore;

        const shape = elementFactory.createShape({
          type: 'bpmn:Task',
          businessObject: businessObject
        });

        create.start(event, shape, element);
      }
    }

    return {
      'append.average-task': {
        group: 'model',
        className: 'bpmn-icon-task bpmn-yellow',
        title: translate('Append Task for Fetch Price'),
        action: {
          click: appendServiceTask(SUITABILITY_FETCH_PRICE),
          dragstart: appendServiceTaskStart(SUITABILITY_FETCH_PRICE)
        }
      },
      'append.high-task': {
        group: 'model',
        className: 'bpmn-icon-task bpmn-green',
        title: translate('Append Task for Process Price'),
        action: {
          click: appendServiceTask(SUITABILITY_PROCESS_PRICE),
          dragstart: appendServiceTaskStart(SUITABILITY_PROCESS_PRICE)
        }
      }
    };
  }
}

CustomContextPad.$inject = [
  'bpmnFactory',
  'config',
  'contextPad',
  'create',
  'elementFactory',
  'injector',
  'translate'
];