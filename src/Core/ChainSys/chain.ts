import { attachLightning } from "./lightning";
import { OzMissile } from "Core";
import { Group, MapPlayer, Unit } from "w3ts";

/*
 *-----------------------------------------------------------------
 *	OzMissile - Chain System Extension
 *	Created by: Ozzzzymaniac
 *
 *	This extension allow you to create a chain missile that handle most of the work
 *  for you in the most efficiently way it could.
 * 	Only need to create a new class that inherit OzChain, and set the value you want
 * 	one super() call for constructor is enough, and 3 function that run on specific
 *  point like, the chain missile hit target, the missile finally decided a new target
 *  the missile is going to be destroyed
 *
 * 	Or if you still feel it not efficiently enough, you can feel free to modify this
 *  as if you want but just leave the original credit to me or else i will nuke your
 *  entire family tree and make sure you won't ever want to take credit of everything
 *  again.
 *
 *  Also don't worry, this library is partially idiot-proof but not completely since
 *  in order to make it completely idiot-proof will cost performance
 *
 *  Version Tree:
 * 		+ 1.0: Initial release
 *-----------------------------------------------------------------
 */

type chainData = {
	jumpAmt: number;
	target: Unit;
	source: Unit;
	owner: MapPlayer;
};

function newData(): chainData {
	return {
		jumpAmt: 0,
		target: null,
		source: null,
		owner: null,
	};
}
export abstract class OzChain {
	public model: string;
	public lightning: string;
	public current: chainData;
	public previous: chainData;
	public next: chainData;
	public damage: number;
	public travelled: number;
	// Begin configuration settings
	public allowSameTarget: boolean;
	public backToFirst: boolean;
	public bounceRange: number;
	public maxBounce: number;
	public speed: number;
	public arc: number;
	public autoReset: boolean;
	// Begin private settings;
	protected ms: OzMissile;
	protected initalized: boolean; // mark that this object has been initialized it interaction
	protected needReset: boolean; // mark that this object needs to be reset as it been finished it previous flight
	protected g: Group; // a group to enumeration to pick new target

	/**
	 * Create  a new Chain Instance
	 * @param modelPath path of the model
	 * @param lightning lightning path of the model
	 */
	constructor(modelPath: string, lightning: string) {
		this.model = modelPath;
		this.lightning = lightning || "";
		this.allowSameTarget = false;
		this.backToFirst = false;
		this.bounceRange = 900;
		this.maxBounce = 6;
		this.speed = 1200;
		this.arc = 0.2;
		this.init();
	}

	protected reset() {
		this.previous = newData();
		this.current = newData();
		this.next = newData();
		this.damage = 0;
		this.travelled = 0;
	}

	private init() {
		this.ms = new OzMissile(null, null);
		this.g = new Group();
		this.ms.onHit = (target) => {
			if (target == this.ms.target && this.current.jumpAmt <= this.maxBounce) {
				this.previous.target = this.current.target;
				this.previous.jumpAmt = this.current.jumpAmt;
				this.current.target = target;
				this.current.jumpAmt = this.next.jumpAmt;
				this.next.target = null;
				if (this.onHit && this.onHit()) return true;
				// Is valid for next jump?
				if (this.bounceRange <= 0 || this.next.jumpAmt > this.maxBounce) return true;
				if (this.onFilter) this.g.enumUnitsInRange(target.x, target.y, this.bounceRange, this.filter);
				else this.g.enumUnitsInRange(target.x, target.y, this.bounceRange, null);
				let s = this.g.size - 1;
				if (s < 0) return true; // No target to bounce to
				let newTarget = this.g.getUnitAt(GetRandomInt(0, s));
				if (!this.allowSameTarget) {
					while (newTarget == target) {
						this.g.removeUnit(newTarget);
						s--;
						newTarget = this.g.getUnitAt(GetRandomInt(0, s));
						if (newTarget == null) return true;
					}
				}
				this.g.clear();
				if (newTarget == null) return true; // Maybe it somehow bypassed the test?
				this.next.target = newTarget;
				this.next.jumpAmt++;
				if (this.onBounce && this.onBounce()) return true;
				if (this.lightning) attachLightning(this.current.source, newTarget, this.lightning);
				this.ms.d;
			} else if (this.current.jumpAmt >= this.maxBounce) {
				return true;
			}
			return false;
		};
		this.ms.onRemove = () => {
			this.onRemove();
			this.needReset = true;
			if (this.autoReset) this.reset();
			return true;
		};
	}

	protected filter(): boolean {
		let u = Unit.fromFilter();
		if (!u.isAlive()) return false;
		if (this.onFilter) return this.onFilter(u);

		return true;
	}

	/**
	 * This function run every time the missile hit target
	 */
	protected abstract onHit(): boolean;

	/**
	 * This function run every time the missile is being destroyed
	 */
	protected abstract onRemove(): boolean;

	/**
	 * This function run every time the missile decided a new target
	 */
	protected abstract onBounce(): boolean;

	/**
	 * This function run as a filter
	 * @param filterTarget
	 *
	 */
	protected abstract onFilter(filterTarget: Unit): boolean;
}
