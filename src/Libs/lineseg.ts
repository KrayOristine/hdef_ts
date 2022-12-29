import { Group, Rectangle, Widget, Destructable, Item } from "w3ts";
const r = new Rectangle(0, 0, 0, 0);
const g = new Group();

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

	r.setRect(xn - offset, yn - offset, xx + offset, yx + offset);
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

export class LineSegment {
	public static lastEnums: Widget[];

	public static enumUnits(minX: number, maxX: number, minY: number, maxY: number, offset: number, checkCollision: boolean): Widget[] {
		prepare_rect(minX, minY, maxX, maxY, offset);
		g.enumUnitsInRect(r, null);
		this.lastEnums = []; // Also drop out any previous enum table

		for (let i = 0; i < g.size - 1; i++) {
			let u = g.getUnitAt(0);
			if (rect_contain_widget(u.handle, checkCollision ? u.collisionSize : 0.0)) {
				this.lastEnums.push(u);
			}
			g.removeUnit(u);
		}

		return this.lastEnums;
	}

	public static enumDestructables(minX: number, maxX: number, minY: number, maxY: number, offset: number): Widget[] {
		prepare_rect(minX, minY, maxX, maxY, offset);
		this.lastEnums = []; // Also drop out any previous enum table

		r.enumDestructables(() => {
			let d = Destructable.fromHandle(GetFilterDestructable());
			if (rect_contain_widget(d.handle, 0.0)) this.lastEnums.push(d);
			return false;
		}, DoNothing);

		return this.lastEnums;
	}

	public static enumItems(minX: number, maxX: number, minY: number, maxY: number, offset: number): Widget[] {
		prepare_rect(minX, minY, maxX, maxY, offset);
		this.lastEnums = []; // Also drop out any previous enum table

		r.enumItems(() => {
			let i = Item.fromHandle(GetFilterItem());
			if (rect_contain_widget(i.handle, 0.0)) this.lastEnums.push(i);
			return false;
		}, DoNothing);

		return this.lastEnums;
	}
}
