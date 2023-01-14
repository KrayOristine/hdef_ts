/**
 *
 * Implementation of JS Native into TS To Lua
 */

// TextEncoder
export class TextEncoder {
	public static encode(input: string): Uint8Array {
		const byteArr = new Uint8Array(input.length);
		for (let i = 0; i < input.length; i++) byteArr[i] = string.byte(input.substring(i, i));

		return byteArr;
	}

	public static encodeInto(source: string, target: Uint8Array): boolean {
		if (!source || !target) return false;
		for (let i = 0; i < source.length; i++) target[i] = string.byte(source.substring(i, i));
		return true;
	}
}
