import { WorldBounds } from "Utils";
export class MissileEffect {
	private arr: MissileEffect[];
	public effect: effect;
	public x: number;
	public y: number;
	public z: number;
	public yaw: number;
	public pitch: number;
	public roll: number;
	public path: string;
	public size: number;
	constructor(x: number, y: number, z: number, modelPath?: string) {
		this.path = modelPath || "";
		this.yaw = 0;
		this.pitch = 0;
		this.roll = 0;
		this.size = 0;
		this.arr = [];
		this.effect = AddSpecialEffect(this.path, x, y);
		BlzSetSpecialEffectZ(this.effect, z);
	}

	destroy() {
		DestroyEffect(this.effect);
		if (this.arr.length > 0) this.arr.forEach((x) => x.destroy());
	}

	scale(v: number) {
		this.size = v;
		BlzSetSpecialEffectScale(this.effect, v);
		return this;
	}

	orient(yaw: number, pitch: number, roll: number) {
		this.yaw = yaw;
		this.pitch = pitch;
		this.roll = roll;
		BlzSetSpecialEffectOrientation(this.effect, yaw, pitch, roll);
		for (let i = 0; i < this.arr.length; i++) {
			this.arr[i].yaw = yaw;
			this.arr[i].pitch = pitch;
			this.arr[i].roll = roll;
			BlzSetSpecialEffectOrientation(this.arr[i].effect, yaw, pitch, roll);
		}
		return this;
	}

	move(x: number, y: number, z: number) {
		if (x > WorldBounds.maxX || x < WorldBounds.minY || y > WorldBounds.maxX || y < WorldBounds.minY) return false;

		BlzSetSpecialEffectPosition(this.effect, x, y, z);
		this.arr.forEach((eff) => {
			BlzSetSpecialEffectPosition(eff.effect, x - eff.x, y - eff.y, z - eff.z);
		});
		return true;
	}

	attach(x: number, y: number, z: number, scale?: number, model?: string) {
		let e = new MissileEffect(x, y, z, model || "");
		if (scale) e.scale(scale);
		BlzSetSpecialEffectPosition(
			e.effect,
			BlzGetLocalSpecialEffectX(e.effect) - x,
			BlzGetLocalSpecialEffectY(e.effect) - y,
			BlzGetLocalSpecialEffectZ(e.effect) - z
		);
		let i = this.arr.push(e);
		return i;
	}

	getAttachEffect(i: number) {
		return this.arr[i].effect || null;
	}
	detach(i: number) {
		if (this.arr[i]) {
			let v = table.remove(this.arr, i);
			v.destroy();
			return true;
		}
		return false;
	}
	setColor(red: number, green: number, blue: number) {
		BlzSetSpecialEffectColor(this.effect, red, green, blue);
		return this;
	}

	timeScale(v: number) {
		BlzSetSpecialEffectTimeScale(this.effect, v);
		return this;
	}

	alpha(v: number) {
		BlzSetSpecialEffectAlpha(this.effect, v);
		return this;
	}

	playerColor(v: number) {
		BlzSetSpecialEffectColorByPlayer(this.effect, Player(v));
		return this;
	}

	animation(v: number) {
		BlzPlaySpecialEffect(this.effect, ConvertAnimType(v));
		return this;
	}
}
