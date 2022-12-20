import { Pool } from "pool";
import { Timer, Group, Unit, MapPlayer, Destructable, Item, Rectangle } from "w3ts";
import { Coords } from "coords";
import { MissileEffect } from "effect";
import { LocGetZ, WorldBounds } from "Utils";
const REFRESH_RATE = 1 / 40;
const SWEET_SPOT = 300;
const UNIT_COLLISION = 128.0;
const ITEM_COLLISION = 16.0;
const r = new Rectangle(0, 0, 0, 0);
const tmr = new Timer();
const g = new Group();
var id = -1,
	pid = -1,
	dilation = 1,
	index = 1;
var last: number, yaw: number, pitch: number, travelled: number;
var arr: WeakMap<OzMissile, WeakMap<Unit | OzMissile | Destructable | Item, boolean>> = new WeakMap(),
	keys = [];
var missile: OzMissile[] = [];
var frozen: OzMissile[] = [];
var count = 0;
var list: OzMissile[] = [];
const mapCliff = GetTerrainCliffLevel(WorldBounds.maxX, WorldBounds.maxY);
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
	public source: Unit;
	public target: Unit;
	public owner: MapPlayer;
	public collision: number;
	public onHit: (targetUnit: Unit) => boolean;
	public onMissile: (targetMissile: OzMissile) => boolean;
	public onPeriod: () => boolean;
	public onItem: (targetItem: Item) => boolean;
	public onDestructable: (targetDestructable: Destructable) => boolean;
	public onCliff: () => boolean;
	public onBoundaries: () => boolean;
	public onFinish: () => boolean;
	public onPause: () => boolean;
	public onResume: () => boolean;
	public onRemove: () => boolean;
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
	private dummy: Unit;
	private open: number;
	private height: number;
	private velocity: number;
	private acceleration: number;
	private turn: number;
	private index: number;
	private pkey: number;
	constructor(source: Unit, target: Unit) {
		this.source = source;
		this.target = target;
		this.owner = source.owner;
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
		if (this.paused) {
			pid++;
			this.pkey = pid;
			frozen[pid] = this;
			if (this.onPause && this.allocated && this.onPause()) this.terminate();
		} else {
			this.terminate();
		}
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

		if (this.dummy) this.dummy.setOwner(this.owner, false);
		else {
			this.dummy = Pool.retrieve(this.x, this.y, this.z, 0);
			if (!this.owner && this.source) this.dummy.setOwner(this.source.owner, false);
			else this.dummy.setOwner(this.owner, false);
		}
		this.dummy.setField(UNIT_RF_SIGHT_RADIUS, v);
	}
	get timeScale() {
		return this._timeScale;
	}
	set timeScale(value: number) {
		this._timeScale = value;
		this.effect.timeScale(value);
	}

	get alpha() {
		return this._alpha;
	}

	set alpha(value: number) {
		this._alpha = value;
		this.effect.alpha(value);
	}

	get playerColor() {
		return this._playerColor;
	}

	set playerColor(value: number) {
		this._playerColor = value;
		this.effect.playerColor(value);
	}

	get animation() {
		return this._animation;
	}

	set animation(value: number) {
		this._animation = value;
		this.effect.animation(value);
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

	isHit(whichUnit: Unit) {
		return arr.get(this).has(whichUnit);
	}

	removeHit(whichUnit: Unit) {
		return arr.get(this).delete(whichUnit);
	}

	flush() {
		return arr.delete(this);
	}

	private checkUnit() {
		if (!this.onHit) return;
		if (!this.allocated && this.collision <= 0) return;
		g.enumUnitsInRange(this.x, this.y, this.collision + UNIT_COLLISION, () => true);
		if (g.size == 0) return;
		while (true) {
			let u = g.getUnitAt(0);
			if (u === null && g.size == 0) return;
			g.removeUnit(u);
			if (arr.get(this).has(u) && !u.inRange(this.x, this.y, this.collision)) continue;
			if (this.useZ) {
				let z = u.z;
				let c = u.collisionSize;
				if (z + c < this.z - this.collision && z + c > this.z + this.collision) continue;
			}
			arr.get(this).set(u, true);
			if (this.allocated && this.onHit(u)) this.terminate();
		}
	}

	private checkMissile() {
		if (!this.onMissile) return;
		if (!this.allocated && this.collision <= 0) return;
		for (let i = 0; i < count; i++) {
			let ms = list[i];
			if (ms == this || arr.get(this).has(ms)) continue;
			let dx = ms.x - this.x;
			let dy = ms.y - this.y;
			if (Math.sqrt(dx * dx + dy * dy) > this.collision) continue;
			arr.get(this).set(ms, true);
			if (this.allocated && this.onMissile(ms)) {
				this.terminate();
				return;
			}
		}
	}

	private checkDestructable() {
		if (!this.onDestructable) return;
		if (!this.allocated && this.collision <= 0) return;
		let col = this.collision;
		r.setRect(this.x - col, this.y - col, this.x + col, this.y + col);
		r.enumDestructables(null, () => {
			let d = Destructable.fromHandle(GetEnumDestructable());
			if (arr.get(this).has(d)) return;
			if (this.useZ) {
				let z = LocGetZ(GetWidgetX(d.handle), GetWidgetY(d.handle));
				let dc = d.occluderHeight;
				if (z + dc < this.z - this.collision && z + dc > this.z + this.collision) return;
			}
			arr.get(this).set(d, true);
			if (this.allocated && this.onDestructable(d)) this.terminate();
		});
	}

	private checkItem() {
		if (!this.onItem) return;
		if (!this.allocated && this.collision <= 0) return;
		let col = this.collision;
		r.setRect(this.x - col, this.y - col, this.x + col, this.y + col);
		r.enumItems(null, () => {
			let i = Item.fromHandle(GetEnumItem());
			if (arr.get(this).has(i)) return;
			if (this.useZ) {
				let z = LocGetZ(GetWidgetX(i.handle), GetWidgetY(i.handle));
				if (z < this.z - this.collision && z > this.z + this.collision) return;
			}
			arr.get(this).set(i, true);
			if (this.allocated && this.onItem(i)) this.terminate();
		});
	}

	private checkCliff() {
		if (!this.onCliff) return;
		if (!this.allocated && this.collision <= 0) return;
		let nxc = GetTerrainCliffLevel(this.nextX, this.nextY);
		let nwc = GetTerrainCliffLevel(this.x, this.y);
		if (nwc > nxc && this.z > (nxc - mapCliff) * bj_CLIFFHEIGHT) return;
		if (this.allocated && this.onCliff()) this.terminate();
	}

	private checkPeriod() {
		if (!this.onPeriod || !this.allocated) return;
		if (this.onPeriod()) this.terminate();
	}

	private onOrient() {
		let a: number;

		// Homing or not
		if (this.target && this.target.typeId != 0) {
			this.impact.move(this.target.x, this.target.y, this.target.getflyHeight() + this.toZ);
			let dx = this.impact.x - this.nextX;
			let dy = this.impact.y - this.nextY;
			a = Math.atan2(dy, dx);
			this.travel = this.origin.distance - Math.sqrt(dx * dx + dy * dy);
		} else {
			a = this.origin.angle;
			this.target = null;
		}

		// turn rate
		if (this.turn != 0 && !(Math.cos(this.cA - a) >= Math.cos(this.turn))) {
			if (Math.sin(a - this.cA) >= 0) this.cA = this.cA + this.turn;
			else this.cA = this.cA - this.turn;
		} else this.cA = a;

		let vel = this.velocity * dilation;
		yaw = this.cA;
		travelled = this.travel + vel;
		this.velocity = this.velocity + this.acceleration;
		this.travel = travelled;
		pitch = this.origin.alpha;
		this.prevX = this.x;
		this.prevY = this.y;
		this.prevZ = this.z;
		this.x = this.nextX;
		this.y = this.nextY;
		this.z = this.nextZ;
		this.nextX = this.x + vel * Math.cos(yaw);
		this.nextY = this.y + vel * Math.sin(yaw);

		// arc calculation
		let s = travelled;
		let d = this.origin.distance;
		let h = this.height;
		if (h != 0 || this.origin.slope != 0) {
			this.nextZ = (4 * h * s * (d - s)) / (d * d) + this.origin.slope * s + this.origin.z;
			pitch = pitch - Math.atan((4 * h * (2 * s - d)) / (d * d));
		}

		//-- curve calculation
		let c = this.open;
		if (c != 0) {
			let dx = (4 * c * s * (d - s)) / (d * d);
			a = yaw + bj_PI / 2;
			this.x = this.x + dx * Math.cos(a);
			this.y = this.y + dx * Math.sin(a);
			yaw = yaw + Math.atan(-(4 * c * (2 * s - d)) / (d * d));
		}
	}

	private checkFinish() {
		if (travelled >= this.origin.distance - 0.0001) {
			this.finished = true;
			if (!this.onFinish) return this.terminate();

			if (this.allocated && this.onFinish()) return this.terminate();

			if (this.travel > 0 && !this.paused) return this.terminate();
			return;
		}

		if (!this.roll) this.effect.orient(yaw, -pitch, 0);
		else this.effect.orient(yaw, -pitch, Math.atan2(this.open, this.height));
	}

	private checkBounds() {
		if (this.effect.move(this.x, this.y, this.z) && this.dummy) {
			this.dummy.x = this.x;
			this.dummy.y = this.y;
			return;
		}

		if (this.onBoundaries && this.allocated && this.onBoundaries()) this.terminate();
	}

	pause(flag: boolean) {
		this.paused = flag;
		if (!this.paused && this.pkey != -1) {
			id++;
			missile[id] = this;
			let rs = frozen[pid];
			rs.pkey = this.pkey;
			frozen[this.pkey] = frozen[pid];
			pid--;
			this.pkey = -1;

			dilation = id + 1 > SWEET_SPOT && SWEET_SPOT > 0 ? (id + 1) / SWEET_SPOT : 1.0;
			if (id == 0) {
				tmr.start(REFRESH_RATE, true, OzMissile.move);
			}
			if ((this.onResume && this.allocated && this.onResume()) || this.finished) {
				this.terminate();
			}
		}
	}

	terminate() {
		if (!this.allocated && !this.launched) return;
		this.allocated = false;
		let ms: OzMissile;

		if (this.pkey != -1) {
			ms = frozen[pid];
			ms.pkey = this.pkey;
			frozen[this.pkey] = frozen[pid];
			pid = pid - 1;
			this.pkey = -1;
		}

		if (this.onRemove) this.onRemove();
		if (this.dummy) Pool.recycle(this.dummy);

		ms = list[count];
		ms.index = this.index;
		list[this.index] = list[count];
		count--;
		this.index = -1;

		this.origin = null;
		this.impact = null;
		this.effect.destroy();
		this.reset();
		arr.delete(this);
	}

	private static move() {
		let i = SWEET_SPOT > 0 ? last : 0;
		let j = 0;
		while (!(j >= SWEET_SPOT && SWEET_SPOT > 0) || j > id) {
			let ms = missile[i];
			if (ms.allocated && !ms.paused) {
				ms.checkUnit();
				ms.checkMissile();
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
			tmr.start(REFRESH_RATE, true, OzMissile.move);
		}
	}
}
