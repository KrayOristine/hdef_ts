import { Ability } from "Datastruct";
import { Item, MapPlayer, Unit } from "w3ts";
import { Checksum } from "codeChecksum";
import { encode, decode } from "codeGen";
import { Logger } from "wc3-treelib";

const _forward: number[][] = [];
const saveIndex: number[] = [0, 0, 0];
const _reverse: number[][] = [];
const stackMaxIndex = 70; // Maximum stack size, this is a recommended size for mostly everything
// The largest possible i got is 90 but be careful as it may exceed string length for sync system

// These are pre-generated random string list for usage for the best security
// 	"l^OikK>)NJFL=]'IvfQZ-E+M0URBqHm~|*r<y!`zAt4S[(P?/ghV2$C,oT&Ww#cD7_5}{6x@31nujaGb9sXY.pde8", //-- 1
// 	"lrE~8(37`p&M)>VG*FDZJ#kSeYfy@NQBv^<!X$_c0?+]uo1Htq=6biR.I-z[xO4},9jd/'wnKaWg{h|2LCs5AmTPU", //-- 2
// 	"!dN2uy?_FHi/PL.+v5EpX^6n41zh79IwVSWb*jZ~Uk&8)DtMT>[$GeoB]',KY3@g|`faJQ#Csl<m(Oc{=RAqr-x0}", //-- 3
// 	"i$qrIs[_&-(b<xno1+a/dOU{vey23!j4z>8.X0Z@LJk=fp}u]H5w79hM'GKB#6)SQ~?lWCETRYFP|gN`,V*t^cADm", //-- 4
// 	"lqImw|VHy'u]e`B(FLYjX+b=)EhvCs!zQ821?NKP#Og[,p@JDM/t&fo<Wc$^_3x5S670T~-r4*.9a>AGi{nUk}RdZ", //-- 5
// 	"Z{~]P,0NT4Xr6M^5mabUphSil2q}>dBeJIko*sj<@u=A_-?+&Qv!Gx.3'#(f1EwyKFR/`HYzDVL[9W)cg7|$tOC8n", //-- 6
// 	"[qK}30_t>#Wa7LCr2m!9NkY$GyzOU~fnS('XTi+]odxJwBZ`@cFV.h|l64)s?5</vpub1gRAE{-&M^eI=*,QHPDj8", //-- 7
// 	"05Tb=s!t*[m&hZaWG7$4v'B,-]x</8gpR~OUn?6Y1#MX9|q.)C2{QKry_PNi@jH}S>fdL^FluEe+kzDoc`JIA(V3w", //-- 8
// 	"^HVg+*GM(EU6Yk,}.S<_&d-bwA~o7rD$`>{5u=PFJTyNnZiczm|v29sa8K43h'f@B!/#[WX)QeLlx]q?tIO1jp0CR", //-- 9
// 	">0vyRNtD7Fg(WdYKJiEqU^.@5),1{xzHk+oSCfnjXhe_#]*2OGrlwI?acu9$3|p/ML8Z!b6~}A[BQ-smTP4<`&'=V", //-- 10
const charList = `Z{~]P,0NT4Xr6M^5mabUphSil2q}>dBeJIko*sj<@u=A_-?+&Qv!Gx.3'#(f1EwyKFR/%HYzDVL[9W)cg7|$tOC8n`; // Character list for usage

export class Encoder {
	protected _code: string[];
	protected _stack: number[][];
	protected _stage: number;
	protected _index: number;
	protected _recursion: number;
	protected readonly _p: MapPlayer;
	protected _locked: boolean;

	constructor(whichPlayer: MapPlayer) {
		this._p = whichPlayer;
		this._locked = false;
		this._stack = [[]]; // Create the first stack
		this._code = [];
		this._stage = 0;
		this._index = 0;
		this._recursion = 0;
		this.addInt(Checksum.sum(whichPlayer.name));
	}

	reset() {
		this._code = [];
		this._index = 0;
		this._stage = 0;
		this._stack = [[]];
		this._recursion = 0;
		this._locked = false;
	}

	public get code() {
		return this._code;
	}

	public get currentStage(): number {
		return this._stage;
	}

	public get currentIndex(): number {
		return this._index;
	}

	public get isLocked(): boolean {
		return this._locked;
	}

	public get owner(): MapPlayer {
		return this._p;
	}

	getStack(stage: number = this._stage, index: number = this._index): number {
		return this._stack[stage][index];
	}

	setStack(value: number, stage: number = this._stage, index: number = this._index): void {
		if (index > stackMaxIndex) return; // Prevent possible user data corruption
		if (stage > this._stage) return;
		this._stack[stage][index] = value;
	}

	addInt(value: number): Encoder {
		if (this._locked) return;
		if (this._recursion >= 8) {
			// some how looped 8 time which usually not good
			Logger.LogCritical(
				"Recursive detected, stack data has been corrupted!, please report\n to the map owner! with this code name: " +
					"CORRUPTED_SAVE_STACK"
			);
			this._locked = true; // perform readonly mark
		}
		if (this._index >= stackMaxIndex) {
			// automatic add stage
			this._stack[this._stage][stackMaxIndex + 1] = 2;
			this._stage++;
			if (!this._stack[this._stage]) this._stack[this._stage] = [];
			else this._index = this._stack[this._stage].length;
			this._recursion++;
			return this.addInt(value);
		}
		if (this._stack[this._stage][this._index] != null) {
			while (this._stack[this._stage][this._index] != null) {
				if (this._index >= stackMaxIndex) {
					this._recursion++;
					return this.addInt(value); // jump to add stage
				}
				this._index = this._index + 1; // prevent clipping value as if an user set a value to this
			}
		}
		this._recursion = 0; // Reset recursion or else :)
		this._index = this._stack[this._stage].push(value);
		return this; // allow method chain
	}

	addUnit(u: Unit): Encoder {
		if (_forward[0][u.typeId] == null) return this.addInt(AddSaveUnit(u));
		return this.addInt(_forward[0][u.typeId]);
	}

	addItem(i: Item): Encoder {
		if (_forward[1][i.typeId] == null) return this.addInt(AddSaveItem(i));
		return this.addInt(_forward[1][i.typeId]);
	}

	addAbil(a: Ability): Encoder {
		if (_forward[2][a.typeId] == null) return this.addInt(AddSaveAbil(a));
		return this.addInt(_forward[2][a.typeId]);
	}

	encode(): boolean {
		if (this._locked) return false;
		this._stack[this._stage][stackMaxIndex + 1] = 3;
		for (let stage of this._stack) {
			if (stage.length > stackMaxIndex + 1) error("Stage stack size exceeded!", 2);
			this._code.push(encode(stage, this._p, charList, charList.length));
		}
		this._locked = true;
		return true;
	}
}

export class Decoder {
	protected _code: string[];
	protected _stack: number[][];
	protected _stage: number;
	protected _index: number;
	protected _recursion: number;
	protected readonly _p: MapPlayer;
	constructor(whichPlayer: MapPlayer) {
		this._p = whichPlayer;
		this._stack = [];
		this._stage = 0;
		this._index = 0;
		this._recursion = 0;
	}

	public set code(code: string | string[]) {
		if (Array.isArray(code)) {
			this._code = code;
		} else {
			this._code.push(code);
		}
	}

	getInt(): number {
		// There is no safety protection
		if (this._stack.length == 0 || this._recursion > 8) return -1;
		if (this._stack[this._stage][this._index] == null) return -1;
		if (this._index >= stackMaxIndex) {
			this._stage++;
			this._index = 0;
			this._recursion++;
			return this.getInt();
		}
		this._recursion = 0;
		this._index++;
		return this._stack[this._stage][this._index - 1];
	}

	getAt(stage: number = this._stage, index: number = this._index): number {
		return this._stack[stage][index];
	}

	decode() {
		if (!this._code) return;
		let r = xpcall(() => {
			for (let str of this._code) {
				let v = decode(str, this._p, charList, charList.length);
				if (v.length == 0) {
					error("Invalid code detected!");
				}
				this._stack.push(v);
			}
		}, Logger.LogCritical);
		return r;
	}
}

export function AddSaveUnit(u: Unit): number {
	if (_reverse[0][u.typeId]) return;
	saveIndex[0]++;
	_forward[0][saveIndex[0]] = u.typeId;
	_reverse[0][u.typeId] = saveIndex[0];
	return saveIndex[0];
}

export function AddSaveItem(i: Item): number {
	if (_reverse[1][i.typeId]) return;
	saveIndex[1]++;
	_forward[1][saveIndex[1]] = i.typeId;
	_reverse[1][i.typeId] = saveIndex[1];
	return saveIndex[1];
}

export function AddSaveAbil(a: Ability): number {
	if (_reverse[2][a.typeId]) return;
	saveIndex[2]++;
	_forward[2][saveIndex[2]] = a.typeId;
	_reverse[2][a.typeId] = saveIndex[2];
	return saveIndex[2];
}
