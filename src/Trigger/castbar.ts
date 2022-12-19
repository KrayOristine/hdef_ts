import { addScriptHook, W3TS_HOOK, Unit, MapPlayer, Trigger } from "w3ts";
import { Ability } from "Datastruct/Ability";

const ct = "||||||||||||||||||||";
const cd = 100 / ct.length;
const cc: boolean[] = [];
const cs: boolean[] = [];
const tg = new Trigger();

function render(rate: number) {
	let a = rate / cd;
	let c = ct.substring(0, a);
	let u = ct.substring(a);

	return string.format("|c00FF0000[|c00FFFF00%s|r|c00000000%s|r|c00FF0000]|r", c, u);
}

function _onCast() {
	let cs = Unit.fromHandle(GetSpellAbilityUnit());
	return true;
}

addScriptHook(W3TS_HOOK.TRIGGER_BEFORE, () => {
	for (let i = 0; i < bj_MAX_PLAYERS; i++) {
		tg.registerPlayerUnitEvent(MapPlayer.fromIndex(i), EVENT_PLAYER_UNIT_ISSUED_ORDER, null);
	}
	tg.addCondition(_onCast);
});
