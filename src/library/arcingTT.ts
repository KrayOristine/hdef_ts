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

	private tmr: timer;

	constructor(str: string, u: unit, x: number, y: number, duration: number, size: number, p: player) {
		this.tmr = CreateTimer();
		this.createEx(str, u, x, y, duration, size, p);
	}

	createEx(str: string, u: unit, x: number, y: number, duration: number, size: number, p: player) {
		let a = ANGLE_RND ? GetRandomReal(0, 2 * bj_PI) : ANGLE;
		let timeScale = Math.max(duration, 0.001);
		let t = TIME_LIFE * timeScale;
		let as = Math.sin(a) * VELOCITY;
		let ac = Math.cos(a) * VELOCITY;
		let tt = CreateTextTag() as texttag;
		if (IsUnitVisible(u, p)) {
			SetTextTagPermanent(tt, false);
			SetTextTagLifespan(tt, t);
			SetTextTagFadepoint(tt, TIME_FADE * timeScale);
			SetTextTagText(tt, str, SIZE_MIN * size);
			SetTextTagPos(tt, x, y, Z_OFFSET);
		}

		let pass = 0;
		TimerStart(this.tmr, 0.03125, true, () => {
			pass += 0.03125;
			if (!tt) return;
			if (pass >= t) {
				PauseTimer(this.tmr);
				DestroyTimer(this.tmr);
				return;
			}
			let point = Math.sin(bj_PI * ((t - pass) / timeScale));
			x += ac;
			y += as;
			SetTextTagPos(tt, x, y, Z_OFFSET + Z_OFFSET_BON * point);
			SetTextTagText(tt, str, (SIZE_MIN + SIZE_BONUS * point) * size);
		});

		ArcTT._lastCreated = this;
		return tt;
	}

	create(str: string, u: unit, duration: number, size: number) {
		return this.createEx(str, u, GetUnitX(u), GetUnitY(u), duration, size, GetLocalPlayer());
	}
}
