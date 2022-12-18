import { Pool, DUMMY_ID, DUMMY_ABIL } from "pool";
import { Timer, Group } from "w3ts";
import { Coords } from "coords";
const REFRESH_RATE = 1 / 40;
const SWEET_SPOT = 300;
const UNIT_COLLISION = 128.0;
const ITEM_COLLISION = 16.0;
const tmr = new Timer();
const g = new Group();
var id = -1,
  pid = -1,
  dilation = 1,
  index = 1;
var last: number, yaw: number, pitch: number, travelled: number;
var arr = [],
  keys = [];
var missile: OzMissile[] = [];
var frozen: OzMissile[] = [];
const updateMove = () => OzMissile.move();
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
  public origin: Coords;
  public impact: Coords;

  __constructor(source: unit, target: unit) {
    this.source = source;
    this.target = target;
    this.owner = GetOwningPlayer(source);
  }

  setLocation(
    x: number,
    y: number,
    z: number,
    toX: number,
    toY: number,
    toZ: number
  ) {}

  static move() {}
}
