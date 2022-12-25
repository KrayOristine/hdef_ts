import { TextTag, Timer, Unit, MapPlayer } from "w3ts";

const SIZE_MIN = 0.018; // Minimum size of text
const SIZE_BONUS = 0.012; // Text size increase
const TIME_LIFE = 1.0; // How long the text lasts
const TIME_FADE = 0.8; // When does the text start to fade
const Z_OFFSET = 70; // Height above unit
const Z_OFFSET_BON = 40; // How much extra height the text gains
const VELOCITY = 2; //  How fast the text moves in x/y plane
const ANGLE = bj_PI / 2; // Movement angle of the text (only if ANGLE_RND is false)
const ANGLE_RND = true; // Is the angle random or fixed
export class ArcTT {
	private static _lastCreated: ArcTT;
	public static get lastCreated() {
		return this._lastCreated;
	}

	private tmr: Timer;

	constructor() {
		this.tmr = new Timer();
	}

	destroy() {
		this.tmr.pause();
		this.tmr.destroy();
	}

	createEx(str: string, u: Unit, x: number, y: number, duration: number, size: number, p: MapPlayer) {
		let a = ANGLE_RND ? GetRandomReal(0, 2 * bj_PI) : ANGLE;
		let timeScale = Math.max(duration, 0.001);
		let t = TIME_LIFE * timeScale;
		let as = Math.sin(a) * VELOCITY;
		let ac = Math.cos(a) * VELOCITY;
		let tt: TextTag;
		if (u.isVisible(p)) {
			tt = new TextTag();
			tt.setPermanent(false);
			tt.setLifespan(t);
			tt.setFadepoint(TIME_FADE * timeScale);
			tt.setText(str, SIZE_MIN * size);
			tt.setPos(x, y, Z_OFFSET);
		}

		let pass = 0;
		this.tmr.start(0.03125, true, () => {
			pass += 0.03125;
			if (!tt) return;
			if (pass >= t) {
				this.destroy();
				return;
			}
			let point = Math.sin(bj_PI * ((t - pass) / timeScale));
			x += ac;
			y += as;
			tt.setPos(x, y, Z_OFFSET + Z_OFFSET_BON * point);
			tt.setText(str, (SIZE_MIN + SIZE_BONUS * point) * size);
		});

		ArcTT._lastCreated = this;
		return tt;
	}

	create(str: string, u: Unit, duration: number, size: number) {
		return this.createEx(str, u, u.x, u.y, duration, size, MapPlayer.fromLocal());
	}
}
