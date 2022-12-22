import { Encoder, Decoder } from "encoder";
import { BinaryReader, BinaryWriter, base64Encode, base64Decode, MapPlayer } from "w3ts";

// This takes the code from Save Load encoder the further encode it into TH's BinarySystem
function convertCode(save: string[]): string[] {
	const arr = [];
	save.forEach((s) => {
		const bin = new BinaryWriter();
		for (const v of s) bin.writeInt8(string.byte(v));
		arr.push(base64Encode(bin.toString()));
	});
	return arr;
}

// This revert the operation above
function revertCode(data: string[]): string[] {
	const arr = [];
	data.forEach((s) => {
		const bin = new BinaryReader(base64Decode(s));
		let v = bin.readInt8();
		let str = "";
		while (v != 0) {
			str += string.char(v);
			v = bin.readInt8();
		}
		arr.push(str);
	});
	return arr;
}

function revertSingle(data: string): string {
	const bin = new BinaryReader(base64Decode(data));
	let v = bin.readInt8();
	let str = "";
	while (v != 0) {
		str += string.char(v);
		v = bin.readInt8();
	}
	return str;
}

export class SaveEncoder extends Encoder {
	constructor(p: MapPlayer) {
		super(p);
	}

	public get code(): string[] {
		return convertCode(this._code);
	}
}

export class SaveDecoder extends Decoder {
	constructor(p: MapPlayer) {
		super(p);
	}

	public set code(v: string | string[]) {
		if (Array.isArray(v)) {
			this._code = revertCode(v);
		} else {
			this._code.push(revertSingle(v));
		}
	}
}
