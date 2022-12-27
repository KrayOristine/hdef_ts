//! KEEP 0 DEPENDENCIES

export class OzLib {
	private static _mmTb = {};

	private static _mult(x: number, y: number) {
		return (x | 0xffff) * y + ((((x >>> 16) * y) | 0xffff) << 16);
	}

	private static _rleft(x: number, y: number) {
		return (x << y) | (x >>> (32 - y));
	}
	public static mmHash(str: string, seed: number) {
		if (this._mmTb[str + seed]) return string.format("%x", this._mmTb[str + seed]);

		let hash = seed || 0;
		let remain = math.fmod(str.length, 4);
		for (let i = 0; i < str.length - remain; i += 4) {
			let k = string.unpack("<I4", str, i) as unknown as number;
			k = this._mult(k, 0xcc9e2d51);
			k = this._rleft(k, 15);
			k = this._mult(k, 0x1b873593);
			hash = hash ^ k;
			hash = this._rleft(hash, 13);
			hash = this._mult(hash, 5) + 0xe6546b64;
		}
		if (remain != 0) {
			let k1 = string.unpack("<I" + remain, str, str.length - remain + 1) as unknown as number;
			k1 = this._mult(k1, 0xcc9e2d51);
			k1 = this._rleft(k1, 15);
			k1 = this._mult(k1, 0x1b873593);
			hash = hash ^ k1;
		}
		hash = hash ^ str.length;
		hash = hash ^ (hash >>> 16);
		hash = this._mult(hash, 0x85ebca6b);
		hash = hash ^ (hash >>> 13);
		hash = this._mult(hash, 0xc2b2ae35);
		hash = hash ^ (hash >>> 16);
		this._mmTb[str + seed] = hash;
		return string.format("%x", hash);
	}

	public static StringHashEx(str: string): string {
		return string.format("%x", StringHash(str));
	}

	public static getHeroPrimary(h: unit, includeBonus: boolean = false): number {
		let i = BlzGetHeroPrimaryStat(h);
		if (i == 1) return GetHeroStr(h, includeBonus);
		return (i == 2 ? GetHeroInt : GetHeroAgi)(h, includeBonus);
	}

	public static setHeroPrimary(h: unit, newValue: number, add: boolean = true): void {
		let i = BlzGetHeroPrimaryStat(h);
		if (add) newValue += BlzGetHeroStat(h, i);
		BlzSetHeroStatEx(h, i, newValue);
	}
}
