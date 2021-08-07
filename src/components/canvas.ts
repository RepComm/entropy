import { Exponent } from "@repcomm/exponent-ts";

export class Canvas extends Exponent {
  //@ts-ignore
  element: HTMLCanvasElement;

  constructor () {
    super();
    this.make("canvas");
    this.applyRootClasses();
    this.addClasses("exponent-canvas");
  }
}
