
import { Panel } from "@repcomm/exponent-ts";
import { IconInput } from "../components/iconinput";

export class Ctrl extends IconInput {
  private _value: number;
  
  constructor () {
    super();
    this.addClasses("ctrl");
    this.setInputType("number");

    this.on("change", ()=>{
      this._value = parseFloat(this.getValue());
    });
  }
  setValue(v: number): this {
    super.setValue(`${v}`);
    this._value = v;
    return this;
  }
  get value (): number {
    return this._value;
  }
  set value(v: number) {
    this.setValue(v);
  }
}

export class CtrlGroup extends Panel {
  private ctrls: Set<Ctrl>;

  constructor () {
    super();
    this.addClasses("ctrl-group");
    this.ctrls = new Set();
  }
  add (ctrl: Ctrl): this {
    if (this.ctrls.has(ctrl)) throw `Ctrl already present, cannot add "${ctrl}"`;
    this.ctrls.add(ctrl);
    ctrl.mount(this);
    return this;
  }
  remove (ctrl: Ctrl): this {
    this.ctrls.delete(ctrl);
    ctrl.unmount();
    return this;
  }
  create (): Ctrl {
    let result = new Ctrl();
    this.add(result);
    return result;
  }
}
