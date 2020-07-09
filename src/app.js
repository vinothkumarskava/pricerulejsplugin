import $ from 'jquery';

import PaletteProvider from 'bpmn-js/lib/features/palette/PaletteProvider';
import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';
import gridModule from "../node_modules/diagram-js/lib/features/grid-snapping/visuals";
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/bpmn';
import BpmnPropertiesProvider from 'bpmn-js-properties-panel/lib/provider/bpmn/BpmnPropertiesProvider';
import defaultDiagramXML from '../resources/diagram.bpmn';
import customModule from './custom';
import custeleExtension from '../resources/custelem.json';
import bpmnExtension from '../resources/bpmn.json';
import dataInputJson from '../resources/datainput.json';

function openViewerDiagram(bpmnXML) {
  var bpmnViewer = new BpmnViewer({
    container: '#js-canvas',
    moddleExtensions: {
      custele: custeleExtension,
      bpmn: bpmnExtension
    }
  });

  try {
    var buttonsContainer = $('.buttons'),
        mainContainer = $('#js-drop-zone');
    buttonsContainer.addClass('with-viewer-diagram');
    bpmnViewer.importXML(bpmnXML, (err) => {
      if (err) {
        mainContainer
          .removeClass('with-viewer-diagram')
          .addClass('with-error');
        mainContainer.find('.error pre').text(err.message);
        console.error(err);
      } else {
        mainContainer
          .removeClass('with-error')
          .addClass('with-viewer-diagram');
      }
    });
  } catch (err) {
    console.log('error rendering', err);
  }
}

function init(configData, diagramXML, savePriceRuleCbk, baseContainer)
{
  var _getPaletteEntries = PaletteProvider.prototype.getPaletteEntries;
  PaletteProvider.prototype.getPaletteEntries = function(element) {
      var entries = _getPaletteEntries.apply(this);
      delete entries['create.intermediate-event'];
      delete entries['create.task'];
      delete entries['create.group'];
      delete entries['create.data-object'];
      delete entries['create.participant-expanded'];
      delete entries['create.subprocess-expanded'];
      delete entries['create.data-store'];
      delete entries['space-tool'];
      delete entries['global-connect-tool'];
      return entries; 
  };

  var _getContextPadEntries = ContextPadProvider.prototype.getContextPadEntries;
  ContextPadProvider.prototype.getContextPadEntries = function(element) {
      var entries = _getContextPadEntries.apply(this, [element]);
      delete entries['append.append-task'];
      delete entries['append.intermediate-event'];
      delete entries['append.text-annotation'];
      delete entries['replace'];
      return entries; 
  };

  BpmnPropertiesProvider.prototype.getElementsConfigurations = function() {
    return configData;
  };
        
  var container = $('#js-drop-zone');
  var fpConditionKeyProps = [];
  // create modeler
  const bpmnModeler = new BpmnModeler({
    container: baseContainer || '#js-canvas',
    propertiesPanel: {
      parent: '#js-properties-panel'
    },
    additionalModules: [
      customModule,
      propertiesPanelModule,
      propertiesProviderModule,
      gridModule
    ],
    moddleExtensions: {
      custele: custeleExtension,
      bpmn: bpmnExtension
    },
    keyboard: { bindTo: document }
  });


  function createNewDiagram() {
    openDiagram(defaultDiagramXML);
  }

  function openDiagram(xml) {
    xml = validateImportXML(xml);
    // import XML
    bpmnModeler.importXML(xml, (err) => {
      if (err) {
        container
          .removeClass('with-diagram')
          .addClass('with-error');

        container.find('.error pre').text(err.message);

        console.error(err);
      } else {
        container
          .removeClass('with-error')
          .addClass('with-diagram');
      }
    });
  }

  function saveSVG(done) {
    bpmnModeler.saveSVG(done);
  }

  function saveDiagram(done) {

    bpmnModeler.saveXML({ format: true }, function(err, xml) {
      done(err, xml);
    });
  }

  function registerFileDrop(container, callback) {

    function handleFileSelect(e) {
      e.stopPropagation();
      e.preventDefault();

      var files = e.dataTransfer.files;
      var file = files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        var xml = e.target.result;
        callback(xml);
      };

      reader.readAsText(file);
    }

    function handleDragOver(e) {
      e.stopPropagation();
      e.preventDefault();

      e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    container.get(0).addEventListener('dragover', handleDragOver, false);
    container.get(0).addEventListener('drop', handleFileSelect, false);
  }


  // file drag / drop ///////////////////////

  // check file api availability
  if (!window.FileList || !window.FileReader) {
    window.alert(
      'Looks like you use an older browser that does not support drag and drop. ' +
      'Try using Chrome, Firefox or the Internet Explorer > 10.');
  } else {
    registerFileDrop(container, openDiagram);
  }

  function getExtensionElement(element, type) {
    if (!element.extensionElements) {
      return;
    }

    return element.extensionElements.values.filter((extensionElement) => {
      return extensionElement.$instanceOf(type);
    })[0];
  }

  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(function() {

    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });

    saveDiagram(function(err, xml) {
      xml = new XMLSerializer().serializeToString(getAdditionalTags(xml));
      if (!isLocal && savePriceRuleCbk && typeof(savePriceRuleCbk) == 'function') {
        savePriceRuleCbk(err, xml);
      }
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  function validateImportXML(xml) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xml, "text/xml");
    var taskNode = xmlDoc.getElementsByTagName("bpmn2:task");
    var processNode = xmlDoc.getElementsByTagName("bpmn2:process")[0];
    var seqNodes = xmlDoc.getElementsByTagName("bpmn2:sequenceFlow");

    for (let index = 0; index < taskNode.length; index++) {
      var element = taskNode[index],
        ioSpecNode = element.getElementsByTagName("bpmn2:ioSpecification")[0],
        inpAssociationNodes = element.getElementsByTagName("bpmn2:dataInputAssociation"),
        outAssociationNodes = element.getElementsByTagName("bpmn2:dataOutputAssociation");
      if (ioSpecNode) {
        //console.log(ioSpecNode);
        element.removeChild(ioSpecNode);
        var tempInpAssArr = [...inpAssociationNodes];
        tempInpAssArr.forEach(inpAssElement => {
          element.removeChild(inpAssElement);  
        });
        var tempOutAssArr = [...outAssociationNodes];
        tempOutAssArr.forEach(outAssElement => {
          element.removeChild(outAssElement);
        });
      }
    }

    var processPropsNodes = processNode.getElementsByTagName("bpmn2:property");
    var tempProcessArr = [...processPropsNodes];
    tempProcessArr.forEach(processPropEl => {
      processNode.removeChild(processPropEl);
    });

    var tempSeqNodes = [...seqNodes];
    tempSeqNodes.forEach(seqNode => {
      var condExpNode = seqNode.getElementsByTagName("bpmn2:conditionExpression")[0];
      if (condExpNode) {
        seqNode.removeChild(condExpNode);
      }
    });

    return new XMLSerializer().serializeToString(xmlDoc);
  }

  function getAdditionalTags(xml) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xml, "text/xml");
    var processNode = xmlDoc.getElementsByTagName("bpmn2:process")[0];
    var planeNode = xmlDoc.getElementsByTagName("bpmndi:BPMNPlane")[0];
    var taskNode = xmlDoc.getElementsByTagName("bpmn2:task");
    var sequenceNodes = xmlDoc.getElementsByTagName("bpmn2:sequenceFlow");
    var gatewayNodes = xmlDoc.getElementsByTagName("bpmn2:exclusiveGateway");

    for (let index = 0; index < taskNode.length; index++) {
      let element = taskNode[index];
      if (!element.getElementsByTagName("bpmn2:ioSpecification")[0]) {
        var elementName = element.getElementsByTagName("custele:customElementName")[0].textContent;
        var xmlTaskSpecDoc = parser.parseFromString(getTaskSpecificHTML(elementName, getTaskElAttributes(element)), "text/xml");
        element.setAttribute("tns:taskName", (elementName == "FETCH_PRICE" ? "FetchPriceFromList" : "ProcessPrice"));
        element.appendChild(xmlTaskSpecDoc.getElementsByTagName("bpmn2:ioSpecification")[0]);
        var elementsArr = xmlTaskSpecDoc.getElementsByTagName("bpmn2:ioDataAssociationContainer")[0].childNodes;
        var tempElArr = [...elementsArr];
        for (var i = 0; i < tempElArr.length; i++) {
          element.appendChild(tempElArr[i]);
        }
      } else {
        setTaskElAttributes(element);
      }
    }

    setDefaultGateway(sequenceNodes, gatewayNodes);

    var processXmlDoc = parser.parseFromString(getProcessPropertiesHtml(), "text/xml");
    var processXmlArr = processXmlDoc.getElementsByTagName("bpmn2:propertyParent")[0].childNodes;
    var tempProcessXmlArr = [...processXmlArr];
    
    for (var i = 0; i < tempProcessXmlArr.length; i++) {
      processNode.appendChild(tempProcessXmlArr[i]);
    }

    if (!processNode.getAttribute("name")) {
      var id = getRandomId();
      processNode.setAttribute("name", "priceRule_" + id);
      processNode.setAttribute("id", "priceRule_" + id);
      planeNode.setAttribute("bpmnElement", "priceRule_" + id);
    }

    return xmlDoc;
  }

  function getTaskElAttributes(element) {
    var attributes = {};
    var elementName = element.getElementsByTagName("custele:customElementName")[0].textContent;
    if(elementName == "FETCH_PRICE") {
      attributes.priceListId = element.getAttribute('custele:priceId');
    } else {
      attributes.priceAdjustment = element.getAttribute('custele:ppAdjustmentOperation') || '';
      attributes.percentage = element.getAttribute('custele:ppAdjustmentValue') || '';
      attributes.roundingPattern = element.getAttribute('custele:ppRoundoffValue') || '';
      attributes.roundOff = element.getAttribute('custele:ppRoundoffOperation') || '';
    }

    return attributes;
  }

  function setTaskElAttributes(element) {
    var attributes = {};
    var elementName = element.getElementsByTagName("custele:customElementName")[0].textContent;
    if (elementName == "FETCH_PRICE") {
      attributes.priceId = element.getAttribute('priceId');
    } else {
      attributes.priceAdjustment = element.getAttribute('ppAdjustmentOperation') || '';
      attributes.percentage = element.getAttribute('ppAdjustmentValue') || '';
      attributes.roundingPattern = element.getAttribute('ppRoundoffValue') || '';
      attributes.roundOff = element.getAttribute('ppRoundoffOperation') || '';
    }

    return attributes;
  }

  function getTaskSpecificHTML(elementName, additionalAttrs) {
    var dataInputArr = dataInputJson[elementName + "_DATA"];
    var returnHtml = '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:java="http://www.java.com/javaTypes" xmlns:tns="http://www.jboss.org/drools" xmlns="http://www.jboss.org/drools" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd http://www.jboss.org/drools drools.xsd http://www.bpsim.org/schemas/1.0 bpsim.xsd" id="Definition" exporter="org.eclipse.bpmn2.modeler.core" exporterVersion="1.4.2.Final-v20171109-1930-B1" expressionLanguage="http://www.mvel.org/2.0" targetNamespace="http://www.jboss.org/drools" typeLanguage="http://www.java.com/javaTypes">';
    var genId = getRandomId();
      
      returnHtml += '<bpmn2:ioSpecification id="InputOutputSpecification_' + genId + '">';

      var dataInputHtml = '',
          dataInputRefHtml = '',
          dataOutputHtml = '',
          dataOutputRefHtml = '',
          dataInputAssociationHtml = '',
          dataOutputAssociationHtml = '';
      dataInputArr.forEach(data => {
        var id = getRandomId();
        additionalAttrs.elementName = elementName;
        additionalAttrs.itemSubjectRef = data.itemSubjectRef;
        additionalAttrs.name = data.name;
        if (data.dataOutPut) {
          dataOutputHtml += '<bpmn2:dataOutput id="DataOutput_' + id + '" itemSubjectRef="' + data.itemSubjectRef + '" name="' + data.name + '" />';
          dataOutputRefHtml += '<bpmn2:dataOutputRefs>DataOutput_' + id + '</bpmn2:dataOutputRefs>';
          dataOutputAssociationHtml += getIODataAssociationHTML(id, "DataOutput_" + id, data.name, data.dataOutPut, additionalAttrs);
        } else {
          dataInputHtml += '<bpmn2:dataInput id="DataInput_' + id + '" itemSubjectRef="' + data.itemSubjectRef + '" name="' + data.name + '" />';
          dataInputRefHtml += '<bpmn2:dataInputRefs>DataInput_' + id + '</bpmn2:dataInputRefs>';
          dataInputAssociationHtml += getIODataAssociationHTML(id, data.name, "DataInput_" + id, data.dataOutPut, additionalAttrs);
        }
      });

      var inputSetHtml = '<bpmn2:inputSet id="InputSet_' + genId + '">';
      inputSetHtml += dataInputRefHtml;
      inputSetHtml += '</bpmn2:inputSet>';
      
      var outputSetHtml = '<bpmn2:outputSet id="OutputSet_' + genId + '">';
      outputSetHtml += dataOutputRefHtml;
      outputSetHtml += '</bpmn2:outputSet>';

      returnHtml += dataInputHtml;
      returnHtml += inputSetHtml;
      returnHtml += dataOutputHtml;
      returnHtml += outputSetHtml;
      returnHtml += '</bpmn2:ioSpecification>';
      returnHtml += '<bpmn2:ioDataAssociationContainer>'
      returnHtml += dataInputAssociationHtml;
      returnHtml += dataOutputAssociationHtml;
      returnHtml += '</bpmn2:ioDataAssociationContainer>'
      returnHtml += '</bpmn2:definitions>';
    return returnHtml;
  }

  function getIODataAssociationHTML(id, sourceRef, targetRef, isOutput, additionalAttrs) {
    var returnHtml = '';
    var srcHtml = '<bpmn2:sourceRef>' + sourceRef + '</bpmn2:sourceRef>'; 
    var trgtHtml = '<bpmn2:targetRef>' + targetRef + '</bpmn2:targetRef>';
    if (isOutput) {
      returnHtml += '<bpmn2:dataOutputAssociation id="DataOutputAssociation_' + id + '">' + srcHtml + trgtHtml + '</bpmn2:dataOutputAssociation>';
    } else {
      if (additionalAttrs[additionalAttrs.name] !== undefined) {
        srcHtml = '<bpmn2:assignment id="Assignment_' + id + '">' +
          '<bpmn2:from xsi:type="bpmn2:tFormalExpression" id="FormalExpression_' + id + '" evaluatesToTypeRef="' + additionalAttrs.itemSubjectRef + '">' + (additionalAttrs[additionalAttrs.name] ? additionalAttrs[additionalAttrs.name] : '') + '</bpmn2:from>' +
          '<bpmn2:to xsi:type="bpmn2:tFormalExpression" id="toFormalExpression_' + id + '">' + targetRef + '</bpmn2:to>' +
          '</bpmn2:assignment>';
        returnHtml += '<bpmn2:dataInputAssociation id="DataInputAssociation_' + id + '">' + trgtHtml + srcHtml + '</bpmn2:dataInputAssociation>';
      } else {
        returnHtml += '<bpmn2:dataInputAssociation id="DataInputAssociation_' + id + '">' + srcHtml + trgtHtml + '</bpmn2:dataInputAssociation>';
      }
    }
    return returnHtml;
  }

  function setDefaultGateway(sequenceNodes, gatewayNodes) {
    var parser = new DOMParser();
    var seqDefaultJson = {};
    var prefixHtml = '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:java="http://www.java.com/javaTypes" xmlns:tns="http://www.jboss.org/drools" xmlns="http://www.jboss.org/drools" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd http://www.jboss.org/drools drools.xsd http://www.bpsim.org/schemas/1.0 bpsim.xsd" id="Definition" exporter="org.eclipse.bpmn2.modeler.core" exporterVersion="1.4.2.Final-v20171109-1930-B1" expressionLanguage="http://www.mvel.org/2.0" targetNamespace="http://www.jboss.org/drools" typeLanguage="http://www.java.com/javaTypes">';
    var returnHtml = prefixHtml;
    for (let index = 0; index < sequenceNodes.length; index++) {
      let element = sequenceNodes[index];
      let fpConditionKey = element.attributes.fpConditionKey;
      let ppConditionValue = element.attributes.ppConditionValue;

      if ((fpConditionKey && fpConditionKey.nodeValue == "Default_Flow")
        || (ppConditionValue && ppConditionValue.nodeValue == "Not_Available")
        || (element.attributes.targetRef && element.attributes.targetRef.nodeValue.includes('EndEvent'))) {
          seqDefaultJson[element.attributes.sourceRef.nodeValue] = element.attributes.id.nodeValue;
      } else if (fpConditionKey) {
        let returnVal = element.attributes['fpConditionValue_' + fpConditionKey.nodeValue];
        returnHtml += '<bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression" id="keyFormalExpression_' + getRandomId() +'" language="http://www.java.com/java">' +
          'return &quot;' + (returnVal ? returnVal.nodeValue : "") + '&quot;.equals(' + fpConditionKey.nodeValue + ');' +
        '</bpmn2:conditionExpression >';

        var processXmlDoc = parser.parseFromString(returnHtml, "text/xml");
        element.appendChild(processXmlDoc.getElementsByTagName("bpmn2:conditionExpression")[0]);
        returnHtml = prefixHtml;

        fpConditionKeyProps.push(fpConditionKey.nodeValue);
      } else if (ppConditionValue) {
        returnHtml += '<bpmn2:conditionExpression xsi:type="bpmn2:tFormalExpression" id="valueFormalExpression_' + getRandomId() +'" language="http://www.java.com/java">' +
          'return fetchPrice != null;' +
        '</bpmn2:conditionExpression >';

        var processXmlDoc = parser.parseFromString(returnHtml, "text/xml");
        element.appendChild(processXmlDoc.getElementsByTagName("bpmn2:conditionExpression")[0]);
        returnHtml = prefixHtml;
      }
    }

    for (let index = 0; index < gatewayNodes.length; index++) {
      let element = gatewayNodes[index];
      if (seqDefaultJson[element.attributes.id.nodeValue]) {
        element.setAttribute("default", seqDefaultJson[element.attributes.id.nodeValue]);
        element.setAttribute("gatewayDirection", "Diverging");
      }
    }
  }

  function getProcessPropertiesHtml() {
    var propertiesArr = [... new Set(fpConditionKeyProps)];
    var addPropertyHtml = "";
    propertiesArr.forEach((property, idx) => {
      addPropertyHtml += '<bpmn2:property id="' + property +'" itemSubjectRef="ItemDefinition_2306" name="' + property + '"/>';
    });

    var returnHtml = '<?xml version="1.0" encoding="UTF-8"?><bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:java="http://www.java.com/javaTypes" xmlns:tns="http://www.jboss.org/drools" xmlns="http://www.jboss.org/drools" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd http://www.jboss.org/drools drools.xsd http://www.bpsim.org/schemas/1.0 bpsim.xsd" id="Definition" exporter="org.eclipse.bpmn2.modeler.core" exporterVersion="1.4.2.Final-v20171109-1930-B1" expressionLanguage="http://www.mvel.org/2.0" targetNamespace="http://www.jboss.org/drools" typeLanguage="http://www.java.com/javaTypes">'+
    '<bpmn2:propertyParent>'+ 
      '<bpmn2:property id="collectionId" itemSubjectRef="ItemDefinition_1493" name="collectionId"/>' +
      '<bpmn2:property id="skuId" itemSubjectRef="ItemDefinition_2306" name="skuId"/>' +
      '<bpmn2:property id="roundOff" itemSubjectRef="ItemDefinition_2306" name="roundOff"/>' +
      '<bpmn2:property id="priceAdjustment" itemSubjectRef="ItemDefinition_2306" name="priceAdjustment"/>' +
      '<bpmn2:property id="roundingPattern" itemSubjectRef="ItemDefinition_12" name="roundingPattern"/>' +
      '<bpmn2:property id="percentage" itemSubjectRef="ItemDefinition_7288" name="percentage"/>' +
      '<bpmn2:property id="priceListId" itemSubjectRef="ItemDefinition_1493" name="priceListId"/>' +
      '<bpmn2:property id="projectRepository" itemSubjectRef="ItemDefinition_1132" name="projectRepository"/>' +
      '<bpmn2:property id="priceRepository" itemSubjectRef="ItemDefinition_41" name="priceRepository"/>' +
      '<bpmn2:property id="priceValueRepository" itemSubjectRef="ItemDefinition_257" name="priceValueRepository"/>' +
      '<bpmn2:property id="priceFacetRepository" itemSubjectRef="ItemDefinition_460" name="priceFacetRepository"/>' +
      '<bpmn2:property id="priceValueProcess" itemSubjectRef="ItemDefinition_647" name="priceValueProcess"/>' +
      '<bpmn2:property id="commonProcess" itemSubjectRef="ItemDefinition_813" name="commonProcess"/>' +
      '<bpmn2:property id="fetchPrice" itemSubjectRef="ItemDefinition_536" name="fetchPrice"/>' +
      '<bpmn2:property id="processPrice" itemSubjectRef="ItemDefinition_536" name="processPrice"/>' +
      '<bpmn2:property id="Property_2" itemSubjectRef="ItemDefinition_2306" name="isPriceProcess"/>' +
      '<bpmn2:property id="Property_3" itemSubjectRef="ItemDefinition_2306" name="flow"/>' +
      '<bpmn2:property id="projectId" itemSubjectRef="ItemDefinition_1493" name="projectId"/>' +
      '<bpmn2:property id="priceListRepository" itemSubjectRef="ItemDefinition_96" name="priceListRepository"/>' +
      '<bpmn2:property id="quantity" itemSubjectRef="ItemDefinition_7288" name="quantity"/>'+
      addPropertyHtml +
    '</bpmn2:propertyParent>';
    return returnHtml;
  }

  function getRandomId() {
    var number = Math.floor(Math.random() * 1000000);
    return (number.toString(36) + number);
  }

  bpmnModeler.on('commandStack.changed', exportArtifacts);

  if(!isLocal) {
    openDiagram(diagramXML || defaultDiagramXML);
  }
}

// helpers //////////////////////

function debounce(fn, timeout) {

  var timer;

  return function() {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}

window.init = init;
window.openViewerDiagram = openViewerDiagram;