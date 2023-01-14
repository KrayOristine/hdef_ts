//! KEEP 0 DEPENDENCIES FROM OTHER SOURCES

import { TextEncoder } from "./jsNative";

export class OzLib {
	private static _mmTb = {};

	private static _mult(x: number, y: number) {
		return (x | 0xffff) * y + ((((x >>> 16) * y) | 0xffff) << 16);
	}

	private static _rleft(x: number, y: number) {
		return (x << y) | (x >>> (32 - y));
	}

	/**
	 * TS Implementation of MurmurHash2
	 *
	 * @author Gary Court
	 * @author Austin Appleby
	 *
	 * @param str ASCII only
	 * @param seed Positive integer only
	 * @return 32-bit positive integer hash
	 */
	public static mmHash2(str: Uint8Array | string, seed: number): number {
		if (typeof str === "string") str = TextEncoder.encode(str);
		let l = str.length,
			h = seed ^ l,
			i = 0,
			k: number;

		while (l >= 4) {
			k = (str[i] & 0xff) | ((str[++i] & 0xff) << 8) | ((str[++i] & 0xff) << 16) | ((str[++i] & 0xff) << 24);

			k = (k & 0xffff) * 0x5bd1e995 + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16);
			k ^= k >>> 24;
			k = (k & 0xffff) * 0x5bd1e995 + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16);

			h = ((h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;

			l -= 4;
			++i;
		}

		switch (l) {
			case 3:
				h ^= (str[i + 2] & 0xff) << 16;
				break;
			case 2:
				h ^= (str[i + 1] & 0xff) << 8;
				break;
			case 1:
				h ^= str[i] & 0xff;
				h = (h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16);
		}

		h ^= h >>> 13;
		h = (h & 0xffff) * 0x5bd1e995 + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16);
		h ^= h >>> 15;

		return h >>> 0;
	}

	/**
	 * TS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
	 *
	 * @author Gary Court
	 * @author Austin Appleby
	 *
	 * @param key ASCII only
	 * @param seed Positive integer only
	 * @return 32-bit positive integer hash
	 */
	public static mmHash3(key: Uint8Array | string, seed: number): number {
		if (typeof key === "string") key = TextEncoder.encode(key);

		let remainder: number, bytes: number, h1: number, h1b: number, c1: number, c2: number, k1: number, i: number;

		remainder = key.length & 3; // key.length % 4
		bytes = key.length - remainder;
		h1 = seed;
		c1 = 0xcc9e2d51;
		c2 = 0x1b873593;
		i = 0;

		while (i < bytes) {
			k1 = (key[i] & 0xff) | ((key[++i] & 0xff) << 8) | ((key[++i] & 0xff) << 16) | ((key[++i] & 0xff) << 24);
			++i;

			k1 = ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
			k1 = (k1 << 15) | (k1 >>> 17);
			k1 = ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

			h1 ^= k1;
			h1 = (h1 << 13) | (h1 >>> 19);
			h1b = ((h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
			h1 = (h1b & 0xffff) + 0x6b64 + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16);
		}

		k1 = 0;
		if (remainder > 0) {
			switch (remainder) {
				case 3:
					k1 ^= (key[i + 2] & 0xff) << 16;
					break;
				case 2:
					k1 ^= (key[i + 1] & 0xff) << 8;
					break;
				case 1:
					k1 ^= key[i] & 0xff;
			}
			k1 = ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
			k1 = (k1 << 15) | (k1 >>> 17);
			k1 = ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
			h1 ^= k1;
		}

		h1 ^= key.length;

		h1 ^= h1 >>> 16;
		h1 = ((h1 & 0xffff) * 0x85ebca6b + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= h1 >>> 13;
		h1 = ((h1 & 0xffff) * 0xc2b2ae35 + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= h1 >>> 16;

		return h1 >>> 0;
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
