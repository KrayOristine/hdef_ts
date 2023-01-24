import { SetUnitZ } from "Utils";
import { addScriptHook, W3TS_HOOK, Unit, Timer, Group } from "w3ts";
let g;
export const DUMMY_ID = FourCC("dumi");
export const DUMMY_ABIL = FourCC("Amrf");
export class Pool {
	static recycle(u: Unit) {
		if (u.typeId != DUMMY_ID) return;
		g.addUnit(u);
		u.x = 0;
		u.y = 0;
		u.pauseEx(true);
	}

	static retrieve(x: number, y: number, z: number, face: number) {
		if (g.size == 0) {
			let u = new Unit(PLAYER_NEUTRAL_PASSIVE, DUMMY_ID, x, y, face);
			SetUnitZ(u, z);
			u.removeAbility(DUMMY_ABIL);
			return u;
		}
		let u = g.getUnitAt(0);
		g.removeUnit(u);
		u.x = x;
		u.y = y;
		SetUnitZ(u, z);
		u.setFacingEx(face);
		return u;
	}

	static delay(u: Unit, time: number) {
		if (u.typeId != DUMMY_ID) return;
		let t = new Timer();
		t.start(time, false, () => {
			Pool.recycle(u);
			t.destroy();
		});
	}
}

const onInit = () => {
	g = new Group();
	for (let i = 0; i <= 300; i++) {
		let u = new Unit(PLAYER_NEUTRAL_PASSIVE, DUMMY_ID, 0, 0, 0);
		u.pauseEx(true);
		g.addUnit(u);
		u.removeAbility(DUMMY_ABIL);
	}
};

addScriptHook(W3TS_HOOK.MAIN_AFTER, ()=>{
	try {
		onInit();
	} catch(e){
		print("Error during initialization of Unit Pool");
		print(e);
	}
});
