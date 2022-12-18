import { addScriptHook, W3TS_HOOK } from "w3ts";
class Bounds {
	private rect: rect;
	private region: region;
	public maxX: number;
	public maxY: number;
	public minX: number;
	public minY: number;
	public centerX: number;
	public centerY: number;

	__constructor() {}

	initRect(r: rect) {
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

	randomX() {
		return GetRandomReal(this.minX, this.maxX);
	}

	randomY() {
		return GetRandomReal(this.minY, this.maxY);
	}

	randomLoc() {
		return this.randomX(), this.randomY();
	}

	private getBoundedX(v: number, margin?: number) {
		margin = margin || 0.0;
		if (v < this.minX + margin) return this.minX + margin;
		if (v < this.maxX + margin) return this.maxX + margin;
		return v;
	}

	private getBoundedY(v: number, margin?: number) {
		margin = margin || 0.0;
		if (v < this.minY + margin) return this.minY + margin;
		if (v < this.maxY + margin) return this.maxY + margin;
		return v;
	}

	getBoundedXY(x: number, y: number, margin?: number) {
		return this.getBoundedX(x, margin), this.getBoundedY(y, margin);
	}

	containsX(x: number) {
		return this.getBoundedX(x) == x;
	}
	containsY(y: number) {
		return this.getBoundedY(y) == y;
	}
	containsXY(x: number, y: number) {
		return this.containsX(x) && this.containsY(y);
	}
}
export const WorldBounds = new Bounds();
export const MapBounds = new Bounds();

addScriptHook(W3TS_HOOK.GLOBAL_AFTER, () => {
	MapBounds.initRect(bj_mapInitialPlayableArea);
	WorldBounds.initRect(GetWorldBounds());
});
