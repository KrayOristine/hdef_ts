import { LocGetZ } from "Utils/loc";
export class Coords {
  private ref: Coords;
  public x: number;
  public y: number;
  public z: number;
  public square: number;
  public distance: number;
  public angle: number;
  public slope: number;
  public alpha: number;
  __constructor(x: number, y: number, z: number) {
    this.ref = this;
    this.move(x, y, z);
  }

  move(x: number, y: number, z: number) {
    (this.x = x), (this.y = y), (this.z = z + LocGetZ(x, y));
    if (this.ref != this) {
      this.calc(this.ref);
    }
  }

  link(to: Coords) {
    this.ref = to;
    to.ref = this;
    this.calc(to);
  }

  calc(b: Coords) {
    let dx: number, dy: number;
    while (true) {
      dx = b.x - this.x;
      dy = b.y - this.y;
      dx = dx * dx + dy * dy;
      dy = SquareRoot(dx);
      if (dx != 0 && dy != 0) {
        break;
      }
      b.x = b.x + 0.01;
      b.z = b.z - LocGetZ(b.x - 0.01, b.y) + LocGetZ(b.x, b.y);
    }
    this.square = dx;
    this.distance = dy;
    this.angle = Atan2(b.y - this.y, b.x - this.x);
    this.slope = (b.z - this.z) / dy;
    this.alpha = Atan(this.slope);
    if (b.ref == this) {
      b.angle = this.angle + bj_PI;
      b.distance = dy;
      b.slope = -this.slope;
      b.alpha = -this.alpha;
      b.square = dx;
    }
  }
}
