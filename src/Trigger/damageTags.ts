import { Damage, OzDamageGameType, OzDamageUserType } from "Core";
import { ArcTT } from "Libs";
import { MapPlayer, Trigger, Unit, W3TS_HOOK, addScriptHook, tsGlobals } from "w3ts";

let et: Trigger;
let dt: Trigger;
const enabled: boolean[] = [];

function setupTags(target: Unit, amt: number, gameType: number, userType: number, p: MapPlayer) {
	let t = amt.toString();
	if ((gameType || userType) && amt > 0) {
		if (userType == OzDamageUserType.miss) t = "MISSED!";
		else if (gameType == OzDamageGameType.physical) {
			if (userType == OzDamageUserType.crit) t = "|c00FF0000" + t; // red
			else t = "|c00FF7F00" + t; // orange
		} else if (gameType == OzDamageGameType.magic) t = "|c006969FF" + t; // blue
		else if (userType == OzDamageUserType.heal) t = "|c0096FF96+ " + t; // green
		else t = "|c00FFFFFF" + t;
	} else t = "|c0096FF96+ " + t; // Is already a heal

	if (p.isLocal()) new ArcTT().create(t, target, 1.5, 2);
}

addScriptHook(W3TS_HOOK.MAP_START, () => {
	dt = new Trigger();
	et = new Trigger();
	for (let i = 0; i < bj_MAX_PLAYERS; i++) {
		et.registerPlayerChatEvent(tsGlobals.Players[i], "-showdmg", false);
	}
	et.addAction(() => {
		let pid = GetPlayerId(GetTriggerPlayer());
		enabled[pid] = !enabled[pid];
	});
	dt.addAction(() => {
		if (!enabled[GetPlayerId(GetLocalPlayer())]) return; // This player doesn't need this
		let d = Damage.current;
		setupTags(d.target, d.damage, d.gameType[0], d.userType[0], d.owner);
	});

	Damage.register("damaged", 99999, null, dt);
});
