import { W3TS_HOOK, addScriptHook, Unit, Trigger, Timer, tsGlobals } from "w3ts";

/*
 *  Movement Speed X by PurgeAndFire
 *  Ported to TS by Ozzzzymaniac
 *
 *  Original: https://www.hiveworkshop.com/threads/movespeedx-for-gui-v1-1-0-0.207607/
 */

const CHECK_PERIOD = 0.02; // The lower the period, the smoother the movement seem but create more lags
const orderMove = new Trigger();
const otherOrder = new Trigger();
const unitList: WeakMap<Unit, MSX> = new WeakMap<Unit, MSX>();
let rAmt: number = 0;

addScriptHook(W3TS_HOOK.MAIN_BEFORE, () => {
	for (let i = 0; i < bj_MAX_PLAYERS; i++) {
		orderMove.registerPlayerUnitEvent(tsGlobals.Players[i], EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER, null);
		orderMove.registerPlayerUnitEvent(tsGlobals.Players[i], EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER, null);
		otherOrder.registerPlayerUnitEvent(tsGlobals.Players[i], EVENT_PLAYER_UNIT_ISSUED_ORDER, null);
	}

	orderMove.addCondition(() => {
		let u = Unit.fromEvent();
		if (unitList.has(u)) {
			let l = unitList.get(u);
			l.x = GetOrderPointX();
			l.y = GetOrderPointY();
		}
		return true;
	});

	otherOrder.addCondition(() => {
		let u = Unit.fromEvent();
		if (unitList.has(u)) {
			let l = unitList.get(u);
			l.x = null;
			l.y = null;
		}
		return true;
	});
});

const oldSet = _G.SetUnitMoveSpeed;
_G.SetUnitMoveSpeed = (u, s) => {
	let unit = Unit.fromHandle(u);
	if (s <= 522) {
		if (!unitList.has(unit)) return oldSet(u, s);
		let obj = unitList.get(unit);
		obj.tmr.pause();
		obj.tmr.destroy();
		obj.u = null;
		unitList.delete(unit);
		return oldSet(u, s);
	}
	if (unitList.has(unit)) {
		let obj = unitList.get(unit);
		obj.tmr.pause();
		obj.reconstruct(unit, s, unit.x, unit.y);
		obj.run();
		return;
	}
	let obj = new MSX(unit, s, unit.x, unit.y);
	unitList.set(unit, obj);
};

const oldGet = _G.GetUnitMoveSpeed;
_G.GetUnitMoveSpeed = (unit) => {
	let u = Unit.fromHandle(unit);
	if (unitList.has(u)) {
		return unitList.get(u).exSpeed / CHECK_PERIOD + 522;
	}
	return oldGet(unit);
};

class MSX {
	public lx: number;
	public ly: number;
	public x: number;
	public y: number;
	public nx: number;
	public ny: number;
	public speed: number;
	public exSpeed: number;
	public u: Unit;
	public tmr: Timer;
	public loopPeriod: number;

	constructor(u: Unit, speed: number, x: number, y: number) {
		this.exSpeed = speed - 512;
		this.loopPeriod = (1 / (speed / 50)) * CHECK_PERIOD;
		this.speed = this.exSpeed * this.loopPeriod;
		this.lx = x;
		this.ly = y;
		this.u = u;
		this.initTimer();
	}

	reconstruct(u: Unit, speed: number, x: number, y: number) {
		this.exSpeed = speed - 512;
		this.loopPeriod = (1 / (speed / 50)) * CHECK_PERIOD;
		this.speed = this.exSpeed * this.loopPeriod;
		this.lx = x;
		this.ly = y;
		this.u = u;
	}

	private initTimer() {
		if (this.tmr == null) this.tmr = new Timer();
		this.run();
	}

	run(): void {
		this.tmr.start(this.loopPeriod, true, () => {
			if (this.u.typeId <= 0) {
				this.tmr.pause();
				this.tmr.destroy();
				unitList.delete(this.u);
				return;
			}
			let newx = this.u.x;
			let newy = this.u.y;
			// let face = this.u.facing
			if ((math.abs(this.nx - this.lx) > this.loopPeriod || math.abs(this.ny - this.ly) > this.loopPeriod) && !this.u.paused) {
				let dx = newx - this.lx;
				let dy = newy - this.ly;
				let dis = math.sqrt(dx * dx + dy * dy);
				//face = math.deg(math.atan(dx,dy))
				//this.u.setFacingEx(face);
				this.nx = (dx / dis) * this.speed;
				this.ny = (dy / dis) * this.speed;

				newx += this.nx;
				newy += this.ny;

				this.u.x = newx;
				this.u.y = newy;
			}
			this.lx = newx;
			this.ly = newy;
		});
	}
}
