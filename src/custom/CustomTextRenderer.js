import TextUtil from 'diagram-js/lib/util/Text';
import { assign } from 'min-dash';
import {
  append as svgAppend,
  attr as svgAttr,
  classes as svgClasses,
  create as svgCreate
} from 'tiny-svg';

export default class CustomTextRenderer{
  constructor(options) {
    this.defaultStyle = {
      box: options.element,
      align: options.align || 'center-bottom',
      padding: options.padding || 2,
      style: {
        fill: options.fill || 'black'
      }
    };
  }

  createTextContent(parentGfx, textContent, options){
    var textUtil = new TextUtil({
      style: {
        fill: options && options.fill || 'black',
        fontFamily: "Arial, sans-serif",
        fontSize: 12,
        fontWeight: "normal",
        lineHeight: 1.2
      }
    });

    var text = textUtil.createText(textContent, options || this.defaultStyle);

    svgClasses(text).add('djs-label');

    //svgAppend(parentGfx, text);

    return text;
  }
}