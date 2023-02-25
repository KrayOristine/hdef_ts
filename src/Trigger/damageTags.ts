import { Damage, DamageEvent, DamageType } from "Core";
import { ArcTT } from "Libs";
import { W3TS_HOOK, addScriptHook } from "w3ts";



function colorizeDamages(amt: number,  attack: boolean, flags: boolean[]): [string,number] {
	if (amt < 0.0 || flags[DamageType.Heal]) return ["|c0096FF96+ " + amt, 1]; // green
	if (flags[DamageType.Pure]) return ["|c00FFFFFF" + amt, 1]; // white
	if (flags[DamageType.Evasion]) return ["MISSED!", 1];
	if (flags[DamageType.Critical]) return ["|c00FF0000" + amt + "!", 2]; // red
	if (flags[DamageType.Physical] || attack) return ["|c00FF7F00" + amt, 1]; // orange
	if (flags[DamageType.Magical] || flags[DamageType.Spell]) return ["|c006969FF" + amt, 1]; // blue
	if (flags[DamageType.Shield]) return ["|c00808080" + amt, 1]; // gray
	return ["|c00E45AAA" + amt, 1]; // Some how it passed all filter, let indicate it a 'error damage'
}

let etrig: trigger;
const enabled: boolean[] = [];
function __etrig_action() {
	let p = GetTriggerPlayer() as player;
	let pid = GetPlayerId(p);
	let chat = GetEventPlayerChatString() as string;
	let action = chat.substring(4,7);
	if (action == "on") enabled[pid] = true;
	else if (action == "off") enabled[pid] = false;
	else enabled[pid] = !enabled[pid];

	DisplayTimedTextToPlayer(p, 0, 0, 15, "Damage tags is now " + (enabled[pid] ? "enabled" : "disabled"));
}

function __onDamage() {
	let d = Damage.current;
	let p = GetOwningPlayer(d.source);
	if (!enabled[GetPlayerId(p)]) return;
	const [text, size] = colorizeDamages(d.damage, d.isAttack, d.flags);
	new ArcTT(text, d.target, GetUnitX(d.target), GetUnitY(d.target), 2, size, p);
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
	etrig = CreateTrigger();
	for (const i of $range(0, bj_MAX_PLAYERS)){
		TriggerRegisterPlayerChatEvent(etrig, Player(i) as player, "-dmg", false);
	}
	TriggerAddAction(etrig, __etrig_action);

	Damage.register(DamageEvent.AFTER, 999999, __onDamage);
});
