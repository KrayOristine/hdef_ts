import { Pool, DUMMY_ID, DUMMY_ABIL } from "pool";
const REFRESH_RATE = 1 / 40;
const SWEET_SPOT = 300;
const UNIT_COLLISION = 128.0;
const ITEM_COLLISION = 16.0;
export class OzMissile {
  public source: unit;
  public target: unit;
  public owner: player;
  public prevX: number;
  public prevY: number;
  public x: number;
  public y: number;
  public nextX: number;
  public nextY: number;
  __constructor(source: unit, target: unit) {
    this.source = source;
    this.target = target;
    this.owner = GetOwningPlayer(source);
  }

  setLocation(x: number, y: number, toX: number, toY: number) {}
}
