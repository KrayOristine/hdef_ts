import { EXGroupEnumUnitInRect } from "Utils";
import {addScriptHook, W3TS_HOOK } from "w3ts";

let r: rect;
let g: group;

function __onInit(){
	r = Rect(0,0,0,0);
  g = CreateGroup() as group;
}

addScriptHook(W3TS_HOOK.MAIN_BEFORE, __onInit)

let ox: number;
let oy: number;
let dx: number;
let dy: number;
let da: number;
let db: number;
let ui: number;
let uj: number;
let wdx: number;
let wdy: number;

function prepare_rect(ax: number, ay: number, bx: number, by: number, offset: number) {
	// -- get center coordinates of rectangle
	ox = 0.5 * (ax + bx);
	oy = 0.5 * (ay + by);

	//-- get rectangle major axis as vector
	dx = 0.5 * (bx - ax);
	dy = 0.5 * (by - ay);

	// get half of rectangle length (da) and height (db)
	da = math.sqrt(dx * dx + dy * dy);
	db = offset;

	//-- get unit vector of the major axis
	ui = dx / da;
	uj = dy / da;

	// prepare bounding rect
	let xn: number;
	let xx: number;
	let yn: number;
	let yx: number;
	if (ax > bx) {
		xn = bx;
		xx = ax;
	} else {
		xn = ax;
		xx = bx;
	}

	if (ay > by) {
		yn = by;
		yx = ay;
	} else {
		yn = ay;
		yx = by;
	}

	SetRect(r, xn - offset, yn - offset, xx + offset, yx + offset);
}

function rect_contain_widget(w: widget, offset: number) {
	wdx = GetWidgetX(w) - ox;
	wdy = GetWidgetY(w) - oy;
	dx = wdx * ui + wdy * uj;
	dy = wdx * -uj + wdy * ui;
	da = da + offset;
	db = db + offset;

	return dx * dx <= da * da && dy * dy <= db * db;
}

function __enumDestructable(){
  let d = GetFilterDestructable() as destructable;
  if (rect_contain_widget(d, 0.0)) LineSegment.lastEnums.push(d);
  return false;
}

function __enumItem(){
  let i = GetFilterItem() as item;
  if (rect_contain_widget(i, 0.0)) LineSegment.lastEnums.push(i);
  return false;
}

export class LineSegment {
	public static lastEnums: widget[];

	public static enumUnits(minX: number, maxX: number, minY: number, maxY: number, offset: number, checkCollision: boolean): widget[] {
		prepare_rect(minX, minY, maxX, maxY, offset);
		EXGroupEnumUnitInRect(g, r);
		this.lastEnums = []; // Also drop out any previous enum table

		for (let i = 0; i < BlzGroupGetSize(g) - 1; i++) {
			let u = BlzGroupUnitAt(g, i) as unit;
			if (rect_contain_widget(u, checkCollision ? BlzGetUnitCollisionSize(u) : 0.0)) {
				this.lastEnums.push(u);
			}
		}

		return this.lastEnums;
	}

	public static enumDestructables(minX: number, maxX: number, minY: number, maxY: number, offset: number): widget[] {
		prepare_rect(minX, minY, maxX, maxY, offset);
		this.lastEnums = []; // Also drop out any previous enum table

    EnumDestructablesInRect(r, Filter(__enumDestructable), DoNothing);
		return this.lastEnums;
	}

	public static enumItems(minX: number, maxX: number, minY: number, maxY: number, offset: number): widget[] {
		prepare_rect(minX, minY, maxX, maxY, offset);
		this.lastEnums = []; // Also drop out any previous enum table

		EnumItemsInRect(r, Filter(__enumItem), DoNothing);
		return this.lastEnums;
	}
}
