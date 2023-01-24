import { Damage, FLAG_USER, FLAG_ENGINE, OzDamageEvent } from "Core";
import { ArcTT } from "Libs";
import { MapPlayer, Trigger, Unit, W3TS_HOOK, addScriptHook, tsGlobals } from "w3ts";

let et: Trigger;
let dt: Trigger;
const enabled: boolean[] = [];

function getTags(amt: number, gameType: boolean[], userType: boolean[]): [string,number] {
	let s = amt.toString();
	if (amt < 0 || userType[FLAG_USER.HEAL]) return ["|c0096FF96+ " + s, 2]; // green
	if (gameType[FLAG_ENGINE.PURE]) return ["|c00FFFFFF" + s, 2];
	if (userType[FLAG_USER.EVASION]) return ["MISSED!", 2];
	if (userType[FLAG_USER.CRITICAL]) return ["|c00FF0000" + s + "!", 4]; // red
	if (gameType[FLAG_ENGINE.PHYSICAL]) return ["|c00FF7F00" + s, 2]; // orange
	if (gameType[FLAG_ENGINE.MAGICAL]) return ["|c006969FF" + s, 2]; // blue
}

function setupTags(target: Unit, amt: number, gameType: boolean[], userType: boolean[], p: MapPlayer) {
	if (p.isLocal()){
		let db = getTags(amt, gameType, userType);
		new ArcTT().create(db[0], target, 3, db[1]);
	}
}

function onInit(){
	dt = new Trigger();
	et = new Trigger();
	for (let i = 0; i < bj_MAX_PLAYERS; i++) {
		et.registerPlayerChatEvent(tsGlobals.Players[i], "-DMG", false);
	}
	et.addAction(() => {
		let p = GetTriggerPlayer();
		let pid = GetPlayerId(p);
		enabled[pid] = !enabled[pid];
		DisplayTimedTextToPlayer(p, 0, 0.5, 6, "Damage tags is now " + (enabled[pid] ? "enabled" : "disabled"));
	});
	dt.addAction(() => {
		if (!enabled[GetPlayerId(GetLocalPlayer())]) return; // This player doesn't need this
		let d = Damage.current;
		setupTags(d.target, d.damage, d.gameType, d.userType, d.owner);
	});

	Damage.register(OzDamageEvent.EVENT_AFTER_DAMAGE, 999999, null, dt);
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
	try {
		onInit();
	} catch (e) {
		print("Error during initialization of Damage Tags Trigger");
		print(e);
	}
});
