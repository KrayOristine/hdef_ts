//import { addScriptHook, W3TS_HOOK } from "w3ts";

export class WorldBounds {
	public static rect: rect;
	public static region: region;
	public static maxX: number;
	public static maxY: number;
	public static minX: number;
	public static minY: number;
	public static centerX: number;
	public static centerY: number;

	public static initRect(r: rect) {
    this.rect = r;
		this.region = CreateRegion();
		this.minX = GetRectMinX(this.rect);
		this.minY = GetRectMinY(this.rect);
		this.maxX = GetRectMaxX(this.rect);
		this.maxY = GetRectMaxY(this.rect);
		this.centerX = (this.minX + this.maxX) / 2;
		this.centerY = (this.minY + this.maxY) / 2;
		RegionAddRect(this.region, this.rect);
	}

	public static randomX() {
		return GetRandomReal(this.minX, this.maxX);
	}

	public static randomY() {
		return GetRandomReal(this.minY, this.maxY);
	}

	public static randomLoc() {
		return { x: this.randomX(), y: this.randomY() };
	}

	public static getBoundedX(v: number, margin?: number) {
		margin = margin ?? 0.0;
		if (v < this.minX + margin) return this.minX + margin;
		if (v < this.maxX + margin) return this.maxX + margin;
		return v;
	}

	public static getBoundedY(v: number, margin?: number) {
		margin = margin ?? 0.0;
		if (v < this.minY + margin) return this.minY + margin;
		if (v < this.maxY + margin) return this.maxY + margin;
		return v;
	}

	public static getBoundedXY(x: number, y: number, margin?: number) {
		return { x: this.getBoundedX(x, margin), y: this.getBoundedY(y, margin) };
	}

	public static containsX(x: number) {
		return this.getBoundedX(x) == x;
	}
	public static containsY(y: number) {
		return this.getBoundedY(y) == y;
	}
	public static containsXY(x: number, y: number) {
		return this.containsX(x) && this.containsY(y);
	}
}

export class MapBounds {
	public static rect: rect;
	public static region: region;
	public static maxX: number;
	public static maxY: number;
	public static minX: number;
	public static minY: number;
	public static centerX: number;
	public static centerY: number;

	public static initRect(r: rect) {
		this.rect = r;
		this.region = CreateRegion();
		this.minX = GetRectMinX(this.rect);
		this.minY = GetRectMinY(this.rect);
		this.maxX = GetRectMaxX(this.rect);
		this.maxY = GetRectMaxY(this.rect);
		this.centerX = (this.minX + this.maxX) / 2;
		this.centerY = (this.minY + this.maxY) / 2;
		RegionAddRect(this.region, this.rect);
	}

	public static randomX() {
		return GetRandomReal(this.minX, this.maxX);
	}

	public static randomY() {
		return GetRandomReal(this.minY, this.maxY);
	}

	public static randomLoc() {
		return { x: this.randomX(), y: this.randomY() };
	}

	public static getBoundedX(v: number, margin?: number) {
		margin = margin ?? 0.0;
		if (v < this.minX + margin) return this.minX + margin;
		if (v < this.maxX + margin) return this.maxX + margin;
		return v;
	}

	public static getBoundedY(v: number, margin?: number) {
		margin = margin ?? 0.0;
		if (v < this.minY + margin) return this.minY + margin;
		if (v < this.maxY + margin) return this.maxY + margin;
		return v;
	}

	public static getBoundedXY(x: number, y: number, margin?: number) {
		return { x: this.getBoundedX(x, margin), y: this.getBoundedY(y, margin) };
	}

	public static containsX(x: number) {
		return this.getBoundedX(x) == x;
	}
	public static containsY(y: number) {
		return this.getBoundedY(y) == y;
	}
	public static containsXY(x: number, y: number) {
		return this.containsX(x) && this.containsY(y);
	}
}

//addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
//	MapBounds.initRect(bj_mapInitialPlayableArea);
//	WorldBounds.initRect(GetWorldBounds());
//});
