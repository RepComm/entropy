import { Panel } from "@repcomm/exponent-ts";
import { Image } from "./image";
import { createVertex, Curve, inverseLerp, lerp, pointDistance, pointDistFromCircle, radians, vertex } from "../utils/curve";

export class CurveEditor extends Panel {
  // private static canvas: OffscreenCanvas;
  private static canvas: HTMLCanvasElement;
  // private static ctx: OffscreenCanvasRenderingContext2D;
  private static ctx: CanvasRenderingContext2D;

  private curve: Curve;
  private display: Image;
  private curveDivisions: number;
  private width: number;
  private height: number;

  // private canvas: OffscreenCanvas;
  private canvas: HTMLCanvasElement;
  // private ctx: OffscreenCanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;
  private curvePoint: vertex;
  private renderPoint: vertex;

  private pointHandleRadius: number;
  private pointHandleFillStyle: string;
  private pointHandleStrokeStyle: string;

  private curveStrokeStyle: string;
  private curveFillStyle: string;

  /**Point in curve space where a touch/mouse is present*/
  private renderedTouchPoint: vertex;
  private normalizedTouchPoint: vertex;
  private isTouched: boolean;
  private touchedHandle: vertex;

  private needsRender: boolean;

  private static initCanvas() {
    // CurveEditor.canvas = new OffscreenCanvas(64, 32);
    CurveEditor.canvas = document.createElement("canvas");
    CurveEditor.canvas.width = 64;
    CurveEditor.canvas.width = 32;
    CurveEditor.canvas.style.position = "absolute";
    CurveEditor.canvas.style.zIndex = "-1";
    CurveEditor.canvas.style.minWidth = "100%";
    CurveEditor.canvas.style.minHeight = "100%";
    
    CurveEditor.canvas.style.maxWidth = "100%";
    CurveEditor.canvas.style.maxHeight = "100%";
    CurveEditor.canvas.style.visibility = "hidden";
    
    CurveEditor.ctx = CurveEditor.canvas.getContext("2d");
    document.body.appendChild(CurveEditor.canvas);
  }
  private static canvasHasInit(): boolean {
    return CurveEditor.canvas !== undefined;
  }
  private static ensureCanvasHasInit() {
    if (!CurveEditor.canvasHasInit()) CurveEditor.initCanvas();
  }
  // static getCanvas(): OffscreenCanvas {
  static getCanvas(): HTMLCanvasElement {
    CurveEditor.ensureCanvasHasInit();
    return CurveEditor.canvas;
  }
  // static getContext(): OffscreenCanvasRenderingContext2D {
  static getContext(): CanvasRenderingContext2D {
    CurveEditor.ensureCanvasHasInit();
    return CurveEditor.ctx;
  }

  constructor(curve: Curve = undefined) {
    super();
    this.addClasses("curveeditor");
    
    setTimeout(()=>{
      this.needsRender = true;
    }, 2000);

    this.renderedTouchPoint = createVertex(0,0);
    this.normalizedTouchPoint = createVertex(0,0);
    this.isTouched = false;

    this.pointHandleRadius = 10;
    this.pointHandleFillStyle = "#08ff00";
    this.pointHandleStrokeStyle = "white";

    this.curveStrokeStyle = "blue";
    this.curveFillStyle = "#ea3aad";

    this.curveDivisions = 16;

    this.display = new Image()
      .addClasses("curveeditor-display", "no-drag")
      .setAttr("draggable", "false")
      //@ts-ignore
      .on("dragstart", (evt: DragEvent )=>{
        evt.preventDefault();
        return false;
      })
      .mount(this);

    this.curve = curve || new Curve(
      createVertex(0, 0),
      createVertex(0.5, 1),
      createVertex(1, 1)
    );

    this.curvePoint = createVertex(0, 0);
    this.renderPoint = createVertex(0, 0);

    const populateTouchRenderPoint = (x: number, y: number) => {
      this.renderedTouchPoint.x = x;
      this.renderedTouchPoint.y = y;
    }
    const calculateTouchNormalizedPoint = ()=>{
      this.renderToNormalized(this.renderedTouchPoint, this.normalizedTouchPoint);
    }

    const onPointerDown = (x: number, y: number) => {     
      x -= this.display.rect.left;
      y -= this.display.rect.top; 
      populateTouchRenderPoint(x, y);
      calculateTouchNormalizedPoint();
      
      //just update the position if we already know the pointer is down
      if (this.isTouched) return;
      this.isTouched = true;

      //try and get the curve handle from the touch
      this.touchedHandle = this.getPointHandleUnder(this.renderedTouchPoint);

      console.log(this.touchedHandle);
    }

    //@ts-ignore
    this.display.on("mousedown", (evt: MouseEvent)=>{
      onPointerDown(evt.clientX, evt.clientY);
    });
    //@ts-ignore
    this.display.on("touchstart", (evt: TouchEvent)=>{
      let t0 = evt.touches[0];
      onPointerDown(t0.clientX, t0.clientY);
    });

    const onPointerUp = () => {
      this.isTouched = false;
    }

    this.display.on("mouseup", ()=>{
      onPointerUp();
    });
    this.display.on("touchend", ()=>{
      onPointerUp();
    });

    const onPointerMove = (x: number, y: number) => {
      x -= this.display.rect.left;
      y -= this.display.rect.top; 

      if (!this.isTouched) return;
      if (!this.touchedHandle) return;

      populateTouchRenderPoint(x, y);
      calculateTouchNormalizedPoint();

      this.touchedHandle.x = this.normalizedTouchPoint.x;
      this.touchedHandle.y = this.normalizedTouchPoint.y;

      this.needsRender = true;
    }

    //@ts-ignore
    this.display.on("mousemove", (evt: MouseEvent)=>{
      onPointerMove(evt.clientX, evt.clientY);
    });
    //@ts-ignore
    this.display.on("touchmove", (evt: TouchEvent)=>{
      let t0 = evt.touches[0];
      onPointerMove(t0.clientX, t0.clientY);
    });

    setInterval(()=>{
      if (this.needsRender) this.render();
    }, 1000/5);

  }

  private getPointHandleUnder (renderTouch: vertex): vertex {
    let dist = 0;
    let dia = this.pointHandleRadius * 2;

    this.normalizedToRender(this.curve.a, this.renderPoint);
    dist = pointDistance(renderTouch, this.renderPoint);
    // console.log(dist);
    if (dist < dia) return this.curve.a;

    this.normalizedToRender(this.curve.b, this.renderPoint);
    dist = pointDistance(renderTouch, this.renderPoint);
    if (dist < dia) return this.curve.b;

    this.normalizedToRender(this.curve.c, this.renderPoint);
    dist = pointDistance(renderTouch, this.renderPoint);
    if (dist < dia) return this.curve.c;

    return undefined;
  }

  private calculateRenderDimensions() {
    let r = this.display.rect;
    this.width = Math.floor(r.width);
    this.height = Math.floor(r.height);
  }
  private grabCanvas() {
    this.canvas = CurveEditor.getCanvas();
    
    // this.mountChild( this.canvas );
    this.ctx = CurveEditor.getContext();
  }
  private resizeCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  private normalizedToRender(p: vertex, out: vertex) {
    out.x = lerp(0, this.width, p.x);
    out.y = lerp( this.height, 0, p.y);
  }
  private renderToNormalized (p: vertex, out: vertex) {
    out.x = inverseLerp(0, this.width, p.x);
    out.y = inverseLerp(this.height, 0, p.y);
  }
  private drawPointHandle(p: vertex) {
    this.ctx.beginPath();
    this.normalizedToRender(p, this.renderPoint);

    this.ctx.ellipse(
      this.renderPoint.x, this.renderPoint.y,
      this.pointHandleRadius, this.pointHandleRadius,
      0, 0, radians(360)
    );

    this.ctx.fill();
    this.ctx.stroke();
  }
  private renderCurve() {
    //a value from 0 to 1 as we cross the divisions of the curve
    let interpolant = 0;

    this.ctx.save();
    this.ctx.strokeStyle = this.curveStrokeStyle;
    this.ctx.fillStyle = this.curveFillStyle;
    this.ctx.setLineDash([5, 15]);
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();

    this.ctx.moveTo(0, this.height);

    //for each point in the curve divisions
    for (let i = 0; i < this.curveDivisions+1; i++) {

      //calculate value along the curve
      interpolant = i / this.curveDivisions;

      //calculate point along the curve (normalized space)
      this.curve.getPoint(interpolant, this.curvePoint);

      //map 0,0 to bottom left, and 1,1 to top right
      this.normalizedToRender(this.curvePoint, this.renderPoint);

      //draw the curve
      this.ctx.lineTo(this.renderPoint.x, this.renderPoint.y);
    }

    this.ctx.lineTo(this.width, this.height);

    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }
  private renderPointHandles () {
    this.ctx.save();
    this.ctx.fillStyle = this.pointHandleFillStyle;
    this.ctx.strokeStyle = this.pointHandleStrokeStyle;

    this.drawPointHandle(this.curve.a);
    this.drawPointHandle(this.curve.b);
    this.drawPointHandle(this.curve.c);

    this.ctx.restore();
  }
  private populateDisplay () {
    this.display.setUrl( this.canvas.toDataURL() );
  }
  private render() {
    this.needsRender = false;
    //populate width and height with proper values based on the curve editor size on screen
    this.calculateRenderDimensions();

    //populate the canvas with the static canvas/context
    this.grabCanvas();

    //resize canvas to dimensions we calculated
    this.resizeCanvas();

    this.renderCurve();

    this.renderPointHandles();

    this.populateDisplay();
  }
}
