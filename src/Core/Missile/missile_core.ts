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
var arr: WeakMap<OzMissile, WeakMap<unit, boolean>> = new WeakMap(),
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
	// Begin private properties
	private _model: string;
	private _duration: number;
	private _scale: number;
	private _speed: number;
	private _arc: number;
	private _curve: number;
	private _vision: number;
	private _timeScale: number;
	private _alpha: number;
	private _playerColor: number;
	private _animation: number;
	private cA: number;
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
		this._model = "";
		this._duration = 0;
		this._scale = 1;
		this._speed = 0;
		this._arc = 0;
		this._curve = 0;
		this._vision = 0;
		this._timeScale = 0;
		this._alpha = 0;
		this._playerColor = 0;
		this._animation = 0;
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

	remove(i: number) {
		if (this.paused) this.onPause();
		else this.onRemove();
		missile[i] = missile[id];
		id = id - 1;
		dilation = id + 1 > SWEET_SPOT && SWEET_SPOT > 0 ? (id + 1) / SWEET_SPOT : 1.0;
		if (id == -1) tmr.pause();
		if (!this.allocated) {
			keys.push(this.key);
		}
		return i - 1;
	}

	get model() {
		return this._model;
	}

	set model(path: string) {
		DestroyEffect(this.effect.effect);
		this.effect.path = path;
		this._model = path;
		this.effect.effect = AddSpecialEffect(path, this.origin.x, this.origin.y);
		BlzSetSpecialEffectZ(this.effect.effect, this.origin.z);
		BlzSetSpecialEffectYaw(this.effect.effect, this.cA);
	}

	get curve() {
		return this._curve;
	}

	set curve(v: number) {
		this.open = Math.tan(v * bj_DEGTORAD) * this.origin.distance;
		this._curve = v;
	}

	get arc() {
		return this._arc;
	}

	set arc(v: number) {
		this.height = (Math.tan(v * bj_DEGTORAD) * this.origin.distance) / 4;
		this._arc = v;
	}

	get scale() {
		return this._scale;
	}

	set scale(v: number) {
		this.effect.size = v;
		this.effect.scale(v);
		this._curve = v;
	}

	get speed() {
		return this._speed;
	}

	set speed(v: number) {
		this.velocity = v * REFRESH_RATE;
		this.speed = v;

		let vel = this.velocity * dilation;
		let s = this.travel + vel;
		let d = this.origin.distance;

		this.nextX = this.x + vel * Math.cos(this.cA);
		this.nextY = this.y + vel * Math.sin(this.cA);
		if (this.height != 0 || this.origin.slope != 0) {
			this.nextZ = (4 * this.height * s * (d - s)) / (d * d) + this.origin.slope * s + this.origin.z;
			this.z = this.nextZ;
		}
	}

	get duration() {
		return this._duration;
	}

	set duration(v: number) {
		this.velocity = Math.max(0.00000001, ((this.origin.distance - this.travel) * REFRESH_RATE) / Math.max(0.00000001, v));
		this.duration = v;

		let vel = this.velocity * dilation;
		let s = this.travel + vel;
		let d = this.origin.distance;
		this.nextX = this.x + vel * Math.cos(this.cA);
		this.nextY = this.y + vel * Math.sin(this.cA);

		if (this.height != 0 || this.origin.slope != 0) {
			this.nextZ = (4 * this.height * s * (d - s)) / (d * d) + this.origin.slope * s + this.origin.z;
			this.z = this.nextZ;
		}
	}

	get vision() {
		return this._vision;
	}

	set vision(v: number) {
		this._vision = v;

		if (this.dummy) {
			SetUnitOwner(this.dummy, this.owner, false);
			BlzSetUnitRealField(this.dummy, UNIT_RF_SIGHT_RADIUS, v);
		} else {
			if (!(this.owner && this.source)) {
				this.dummy = Pool.retrieve(this.x, this.y, this.z, 0);
				SetUnitOwner(this.dummy, GetOwningPlayer(this.source), false);
				BlzSetUnitRealField(this.dummy, UNIT_RF_SIGHT_RADIUS, v);
			} else {
				this.dummy = Pool.retrieve(this.x, this.y, this.z, 0);
				SetUnitOwner(this.dummy, this.owner, false);
				BlzSetUnitRealField(this.dummy, UNIT_RF_SIGHT_RADIUS, v);
			}
		}
	}

	attachEffect(x: number, y: number, z: number, scale: number, model: string) {
		return this.effect.attach(x, y, z, scale, model);
	}

	detachEffect(index: number) {
		return this.effect.detach(index);
	}
	color(r: number, g: number, b: number) {
		this.effect.setColor(r, g, b);
		return this;
	}

	isHit(whichUnit: unit) {
		return arr.get(this).has(whichUnit);
	}

	removeHit(whichUnit: unit) {
		return arr.get(this).delete(whichUnit);
	}

	flush() {
		return arr.delete(this);
	}

	pause(flag) {}

	static move() {
		let i = SWEET_SPOT > 0 ? last : 0;
		let j = 0;
		while (!(j >= SWEET_SPOT && SWEET_SPOT > 0) || j > id) {
			let ms = missile[i];
			if (ms.allocated && !ms.paused) {
				ms.checkUnit();
				ms.checkDestructable();
				ms.checkItem();
				ms.checkCliff();
				ms.checkPeriod();
				ms.onOrient();
				ms.checkFinish();
				ms.checkBounds();
			} else {
				i = ms.remove(i);
				j = j - 1;
			}

			i = i + 1;
			j = j + 1;
			if (i > id && SWEET_SPOT > 0) {
				i = 0;
			}
		}
		last = i;
	}

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
