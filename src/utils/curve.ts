
export interface vertex {
  x: number;
  y: number;
}

export const createVertex = (x: number, y: number): vertex => {
  return {x, y};
}

export const lerp = (from: number, to: number, by: number): number => (1-by)*from+by*to;

export const inverseLerp = (from: number, to: number, value: number): number => {
  return (value - from) / (to - from);
}

export const line_lerp = (from: vertex, to: vertex, by: number, out: vertex) => {
  out.x = lerp(from.x, to.x, by);
  out.y = lerp(from.y, to.y, by);
}

export const radians = (degrees: number) => degrees * Math.PI / 180;
export const degrees = (radians: number) => radians * 180 / Math.PI;

export class Curve {
  a: vertex;
  b: vertex;
  c: vertex;

  private p_ab: vertex;
  private p_bc: vertex;

  private temp: vertex;

  constructor (a: vertex, b: vertex, c: vertex) {
    this.a = a;
    this.b = b;
    this.c = c;

    this.p_ab = createVertex(0, 0);
    this.p_bc = createVertex(0, 0);

    this.temp = createVertex(0, 0);
  }
  getPoint (t: number, out: vertex) {
    //get point along line ab by interpolant t
    line_lerp(this.a, this.b, t, this.p_ab);

    //get point along line bc by interpolant t
    line_lerp(this.b, this.c, t, this.p_bc);

    //get point along line create by above two points, by interpolant t
    //this is the point along the curve abc by interpolant t
    line_lerp(this.p_ab, this.p_bc, t, out);
  }
  getY (t: number): number {
    this.getPoint(t, this.temp);
    return this.temp.y;
  }
}

export const pointDistance = (a: vertex, b: vertex): number => Math.sqrt(
  Math.pow(a.x - b.x, 2) +
  Math.pow(a.y - b.y, 2)
);

export const pointDistFromCircle = (p: vertex, cp: vertex, cr: number): number => {
  return pointDistance(p, cp) - cr;
}
