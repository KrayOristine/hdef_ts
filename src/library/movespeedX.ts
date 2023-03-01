import { safeFilter } from "Utils";
import { W3TS_HOOK, addScriptHook } from "w3ts";

/*
 *  Movement Speed X by PurgeAndFire
 *  Ported to TS by Ozzzzymaniac and also changed a little bit
 *
 *  Original: https://www.hiveworkshop.com/threads/movespeedx-for-gui-v1-1-0-0.207607/
 */

const CHECK_PERIOD = 0.02; // The lower the period, the smoother the movement seem but create more lags
let orderMove: trigger;
let otherOrder: trigger;
const unitList: WeakMap<unit, MSX> = new WeakMap<unit, MSX>();

function __onMove(){
  let u = GetOrderedUnit() as unit;
  if (!unitList.has(u)) return false;

  let l = unitList.get(u) as MSX;
  l.x = GetOrderPointX();
  l.y = GetOrderPointY();
  return false;
}

function __onOrder() {
  let u = GetOrderedUnit() as unit;
  if (unitList.has(u)) return false;

  let l = unitList.get(u) as MSX;
  l.x = 0;
  l.y = 0;
  return false;
}

function __onInit() {
	orderMove = CreateTrigger();
	otherOrder = CreateTrigger();

	for (let i = 0; i < bj_MAX_PLAYERS; i++) {
    const p = Player(i) as player;
		TriggerRegisterPlayerUnitEvent(orderMove, p, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER, safeFilter);
		TriggerRegisterPlayerUnitEvent(orderMove, p, EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER, safeFilter);
		TriggerRegisterPlayerUnitEvent(otherOrder, p, EVENT_PLAYER_UNIT_ISSUED_ORDER, safeFilter);
	}

	TriggerAddCondition(orderMove, Condition(__onMove));
  TriggerAddCondition(otherOrder, Condition(__onOrder));
}

addScriptHook(W3TS_HOOK.MAIN_BEFORE, __onInit);

const oldSet = _G.SetUnitMoveSpeed;
_G.SetUnitMoveSpeed = (u, s) => {
	if (s <= 522) {
		if (!unitList.has(u)) return oldSet(u, s);
		let obj = unitList.get(u) as MSX;
		PauseTimer(obj.tmr);
		DestroyTimer(obj.tmr);
		unitList.delete(u);
		return oldSet(u, s);
	}
	if (unitList.has(u)) {
		let obj = unitList.get(u) as MSX;
		PauseTimer(obj.tmr);
		obj.reconstruct(u, s, GetUnitX(u), GetUnitY(u));
		obj.run();
		return;
	}
	let obj = new MSX(u, s, GetUnitX(u), GetUnitY(u));
	unitList.set(u, obj);
};

const oldGet = _G.GetUnitMoveSpeed;
_G.GetUnitMoveSpeed = (u) => {
	if (unitList.has(u)) {
		return (unitList.get(u) as MSX).exSpeed / CHECK_PERIOD + 522;
	}
	return oldGet(u);
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
	public u: unit;
	public tmr: timer;
	public loopPeriod: number;

	constructor(u: unit, speed: number, x: number, y: number) {
		this.exSpeed = speed - 512;
		this.loopPeriod = (1 / (speed / 50)) * CHECK_PERIOD;
		this.speed = this.exSpeed * this.loopPeriod;
		this.lx = x;
		this.ly = y;
    this.x = 0;
    this.y = 0;
    this.nx = 0;
    this.ny = 0;
    this.tmr = CreateTimer();
		this.u = u;
		this.run();
	}

	reconstruct(u: unit, speed: number, x: number, y: number) {
		this.exSpeed = speed - 512;
		this.loopPeriod = (1 / (speed / 50)) * CHECK_PERIOD;
		this.speed = this.exSpeed * this.loopPeriod;
		this.lx = x;
		this.ly = y;
		this.u = u;
	}

	run(): void {
		TimerStart(this.tmr, this.loopPeriod, true, () => {
			if (GetUnitTypeId(this.u) <= 0) {
				PauseTimer(this.tmr);
		    DestroyTimer(this.tmr);
				unitList.delete(this.u);
				return;
			}
			let newX = GetUnitX(this.u);
			let newY = GetUnitY(this.u);
			// let face = this.u.facing
			if ((math.abs(this.nx - this.lx) > this.loopPeriod || math.abs(this.ny - this.ly) > this.loopPeriod) && !IsUnitPaused(this.u)) {
				let dx = newX - this.lx;
				let dy = newY - this.ly;
				let dis = math.sqrt(dx * dx + dy * dy);
				//face = math.deg(math.atan(dx,dy))
				//this.u.setFacingEx(face);
				this.nx = (dx / dis) * this.speed;
				this.ny = (dy / dis) * this.speed;

				newX += this.nx;
				newY += this.ny;

				SetUnitX(this.u, newX);
				SetUnitY(this.u, newY);
			}
			this.lx = newX;
			this.ly = newY;
		});
	}
}
