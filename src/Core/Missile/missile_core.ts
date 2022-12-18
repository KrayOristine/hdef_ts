import { Pool, DUMMY_ID, DUMMY_ABIL } from "pool";
import { Timer, Group } from "w3ts";
import { Coords } from "coords";
import { MissileEffect } from "effect";
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
var arr = new WeakMap(),
	keys = [];
var missile: OzMissile[] = [];
var frozen: OzMissile[] = [];
var count = 0;
var list: OzMissile[] = [];
const updateMove = () => OzMissile.move();
export class OzMissile {
	public prevX: number;
	public prevY: number;
	public prevZ: number;
	public x: number;
	public y: number;
	public z: number;
	public nextX: number;
	public nextY: number;
	public nextZ: number;
	public toX: number;
	public toY: number;
	public toZ: number;
	public origin: Coords;
	public impact: Coords;
	public effect: MissileEffect;

	// Configurable properties
	public source: unit;
	public target: unit;
	public owner: player;
	public collision: number;
	public onHit: Function;
	public onMissile: Function;
	public onPeriod: Function;
	public onItem: Function;
	public onDestructable: Function;
	public onCliff: Function;
	public onBoundaries: Function;
	public onFinish: Function;
	public onPause: Function;
	public onResume: Function;
	public onRemove: Function;
	public paused: boolean;
	public finished: boolean;
	public roll: boolean;
	public useZ: boolean;
	public data: any;
	public damage: number;
	public travel: number;
	public type: number;
	public model: string;
	public duration: number;
	public scale: number;
	public speed: number;
	public arc: number;
	public curve: number;
	public vision: number;
	public timeScale: number;
	public alpha: number;
	public playerColor: number;
	public animation: number;
	// Begin private properties
	private launched: boolean;
	private allocated: boolean;
	private key: number;
	private dummy: unit;
	private open: number;
	private height: number;
	private velocity: number;
	private acceleration: number;
	private turn: number;
	private index: number;
	private pkey: number;
	constructor(source: unit, target: unit) {
		this.source = source;
		this.target = target;
		this.owner = GetOwningPlayer(source);
		arr.set(this, new WeakMap());
		if (keys.length > 0) {
			this.key = keys[keys.length];
			keys[keys.length] = null;
		} else {
			this.key = index;
			index++;
		}

		this.allocated = true;
		this.onHit = null;
		this.onMissile = null;
		this.onDestructable = null;
		this.onItem = null;
		this.onCliff = null;
		this.onFinish = null;
		this.onPause = null;
		this.onResume = null;
		this.onRemove = null;
		this.onBoundaries = null;
		this.reset();
	}
	reset() {
		this.launched = false;
		this.useZ = false;
		this.finished = false;
		this.paused = false;
		this.roll = false;
		this.source = null;
		this.target = null;
		this.owner = null;
		this.dummy = null;
		this.open = 0;
		this.height = 0;
		this.velocity = 0;
		this.acceleration = 0;
		this.collision = 0;
		this.damage = 0;
		this.travel = 0;
		this.turn = 0;
		this.data = 0;
		this.type = 0;
		this.pkey = -1;
		this.index = -1;
		this.model = "";
		this.duration = 0;
		this.scale = 1;
		this.speed = 0;
		this.arc = 0;
		this.curve = 0;
		this.vision = 0;
		this.timeScale = 0;
		this.alpha = 0;
		this.playerColor = 0;
		this.animation = 0;
	}

	setup(x: number, y: number, z: number, toX: number, toY: number, toZ: number) {
		this.origin = new Coords(x, y, z);
		this.impact = new Coords(toX, toY, toZ);
		this.effect = new MissileEffect(x, y, this.origin.z);
		this.origin.link(this.impact);
		this.prevX = x;
		this.prevY = y;
		this.prevZ = this.impact.z;
		this.x = x;
		this.y = y;
		this.z = this.impact.z;
		this.nextX = x;
		this.nextY = y;
		this.nextZ = this.impact.z;
		this.toZ = toZ;
	}

	static move() {}

	launch() {
		if (this.launched && this.allocated) return;
		this.launched = true;
		id++;
		missile[id] = this;
		count++;
		this.index = count;
		list[count] = this;

		dilation = id + 1 > SWEET_SPOT && SWEET_SPOT > 0 ? (id + 1) / SWEET_SPOT : 1.0;

		if (id == 0) {
			tmr.start(REFRESH_RATE, true, updateMove);
		}
	}
}
