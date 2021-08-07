
import { Panel, Input, Text } from "@repcomm/exponent-ts";
import { InputType } from "@repcomm/exponent-ts/docs/exponents/input";
import { Image } from "./image";

export class IconInput extends Panel {
  private icon: Image;
  private label: Text;
  private input: Input;

  private valueChangeListeners: Set<EventListener>;

  constructor () {
    super();
    this.valueChangeListeners = new Set();

    this.addClasses("iconbutton");

    this.icon = new Image()
    .addClasses("iconbutton-icon")
    .mount(this);

    this.label = new Text()
    .addClasses("iconbutton-label")
    .mount (this);

    this.input = new Input()
    .addClasses("iconbutton-input")
    .mount(this);
  }
  setIcon (url: string): this {
    this.icon.setUrl(url);
    return this;
  }
  setLabel (text: string): this {
    this.label.setTextContent(text);
    return this;
  }
  setValue (v: string|any): this {
    this.input.setValue(v);
    return this;
  }
  getValue (): string {
    return this.input.getValue();
  }
  setEditable (editable: boolean = true): this {
    if (editable) {
      this.input.setAttr("readonly", "readonly");
    } else {
      this.input.removeAttr("readonly");
    }
    return this;
  }
  setInputType (type: InputType): this {
    this.input.setType(type);
    return this;
  }
  on(type: string, callback: EventListener, options?: any): this {
    if (type === "change") {
      this.valueChangeListeners.add(callback);
    } else {
      super.on(type, callback, options);
    }
    return this;
  }
  off(type: string, callback: EventListener): this {
    if (type === "change") {
      this.valueChangeListeners.delete(callback);
    } else {
      super.off(type, callback);
    }
    return this;
  }
}
