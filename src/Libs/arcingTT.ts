import { TextTag, Timer, Unit, MapPlayer } from "w3ts";
import { Players } from "w3ts/globals";

const SIZE_MIN = 0.018; //@type number     -- Minimum size of text
const SIZE_BONUS = 0.012; //@type number     -- Text size increase
const TIME_LIFE = 1.0; //@type number     -- How long the text lasts
const TIME_FADE = 0.8; //@type number     -- When does the text start to fade
const Z_OFFSET = 50; //@type number     -- Height above unit
const Z_OFFSET_BON = 50; //@type number     -- How much extra height the text gains
const VELOCITY = 2; //@type number     -- How fast the text moves in x/y plane
const ANGLE = bj_PI / 2; //Movement angle of the text (only if ANGLE_RND is false)
const ANGLE_RND = true; //Is the angle random or fixed
export class ArcTT {
	private static _lastCreated: ArcTT;
	public static get lastCreated() {
		return this._lastCreated;
	}

	private tmr: Timer;
	private tt: TextTag;

	constructor() {
		this.tmr = new Timer();
		this.tt = new TextTag();
	}

	destroy() {
		this.tmr.pause();
		this.tmr.destroy();
		this.tt.destroy();
	}

	create(str: string, u: Unit, x: number, y: number, duration: number, size: number, p: MapPlayer) {
		let a = ANGLE_RND ? GetRandomReal(0, 2 * bj_PI) : ANGLE;
		let timeScale = Math.max(duration, 0.001);
		let t = TIME_LIFE * timeScale;
		let as = Math.sin(a) * VELOCITY;
		let ac = Math.cos(a) * VELOCITY;
	}
}
