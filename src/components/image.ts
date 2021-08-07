import { Exponent } from "@repcomm/exponent-ts";

export class Image extends Exponent {
  //@ts-ignore
  element: HTMLImageElement;

  constructor () {
    super();
    this.make("img");
    this.addClasses("exponent-image");
    this.applyRootClasses();
  }
  setUrl (url: string): this {
    this.element.src = url;
    return this;
  }
}
