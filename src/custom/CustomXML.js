import dataInputJson from '../../resources/datainput.json';

const ELEMENT_PROCESS_PRICE = "PROCESS_PRICE",
      ELEMENT_FETCH_PRICE = "FETCH_PRICE";

export default class CustomXML{

  static getIOSpecification(bpmnFactory, customElementName) {
    var ioSpecification = bpmnFactory.create('bpmn:InputOutputSpecification');
    var dataInputArr = dataInputJson[customElementName + "_DATA_INPUT"];

    var inputSet = bpmnFactory.create('bpmn:InputSet');
    inputSet.id = "InputSet_0";

    var dataInput = "";
    dataInputArr.forEach(dataInp => {
      dataInput = bpmnFactory.create('bpmn:DataInput');

      var number = Math.floor(Math.random() * 1000000);
      var id = number.toString(36) + number;

      dataInput.id = "DataInput_" + id;
      dataInput.name = dataInp.name;
      dataInput.itemSubjectRef = dataInp.itemSubjectRef;
      ioSpecification.get('dataInputs').push(dataInput);

      // var dataInputAssociation = this.getInpAssociation(bpmnFactory, dataInput.name, id, dataInp.itemSubjectRef);
      // ioSpecification.get('dataInputAssociations').push(dataInputAssociation);

      var dataInputRef = bpmnFactory.create('bpmn:DataInput');
      dataInputRef.id = dataInput.id;

      inputSet.get('dataInputRefs').push(dataInputRef);
    });
  
    var dataOutput = bpmnFactory.create('bpmn:DataOutput');
    dataOutput.id = "DataOutput_0";

    var outputSet = bpmnFactory.create('bpmn:OutputSet');
    outputSet.id = "OutputSet_0";
  
      var dataOutputRef = bpmnFactory.create('bpmn:DataOutput');
      dataOutputRef.id = "DataOutput_0";
  
      outputSet.get('dataOutputRefs').push(dataOutputRef);

    // using get(...) to fail safe initialize a collection property
    //ioSpecification.get('dataInputs').push(dataInput);
    ioSpecification.get('dataOutputs').push(dataOutput);
    ioSpecification.get('inputSets').push(inputSet);
    ioSpecification.get('outputSets').push(outputSet);
    
    /*bpmnFactory.create('bpmn:InputOutputSpecification', {
      dataInputs: [ dataInput ]
    });*/
  
    return ioSpecification;
  }
  
  static getInpAssociation(bpmnFactory, dataInputName, dataInputId, itemSubjectRef) {
    var dataInputAssociation = bpmnFactory.create('bpmn:DataInputAssociation');
    dataInputAssociation.id = "dataInputAssociation_" + dataInputId;

      var sourceRef = bpmnFactory.create('bpmn:ItemAwareElement');
      sourceRef.id = dataInputName;

      var targetRef = bpmnFactory.create('bpmn:ItemAwareElement');
      targetRef.id = "DataInput_" + dataInputId;

      dataInputAssociation.get('targetRef').push(targetRef);

      if (dataInputName == "priceListId") {
        var assignment = bpmnFactory.create('bpmn:Assignment');
        assignment.id = "assignment_" + dataInputId;

          var from = bpmnFactory.create('bpmn:Expression');
          from.id = dataInputName;
          from.xml = 'bpmn2:tFormalExpression';
          //from.evaluatesToTypeRef = itemSubjectRef;

          var to = bpmnFactory.create('bpmn:Expression');
          to.id = "DataInput_" + dataInputId;
          from.xml = 'bpmn2:tFormalExpression';

          assignment.get('from').push(from);
          assignment.get('to').push(to);

        dataInputAssociation.get('assignment').push(assignment);
      } else {
        dataInputAssociation.get('sourceRef').push(sourceRef);
      }

    return dataInputAssociation;
  }

}