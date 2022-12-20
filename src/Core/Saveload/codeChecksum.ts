export class Checksum {
	private static toNum(data: string) {
		let a = 0,
			b = 0,
			c = data.length;
		for (let i = 0; i < c; i++) {
			a = math.fmod(a + string.byte(data, i), 0xffff);
			b = math.fmod(a + b, 0xffff);
		}
		return b * 0x10000 + a;
	}

	public static readonly alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	public static readonly alphaLen = this.alphabet.length;

	private static toChar(v: number, mult: number = 0): string {
		let loc: number;
		if (mult == 0) loc = Math.floor(v);
		else loc = Math.floor(v / (this.alphaLen ^ mult));
		let res = this.alphabet.substring(loc, loc);
		if (mult == 0 && v > this.alphaLen) res += this.toChar(v, 5);
		return mult == 0 ? res : res + this.toChar(math.fmod(v, this.alphaLen ^ mult), mult - 1);
	}
	public static sum(data: string) {
		return this.toNum(data);
	}

	public static serial(data: string) {
		return this.toChar(this.toNum(data));
	}
}
