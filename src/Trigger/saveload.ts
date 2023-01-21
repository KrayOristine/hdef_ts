import { SyncRequest, File, W3TS_HOOK, addScriptHook, Trigger, MapPlayer } from "w3ts";
import { SaveEncoder, SaveDecoder, Checksum } from "Core/index";

const CMD_REF = "-"; // What used to append other commands
const CHAT = {
	saveNormal: "save",
	loadNormal: "load",
	saveAuto: "saveEx",
	loadAuto: "loadEx",
};
const BASE_PATH = "NAM_LCTK";
const saveTrg: Trigger[] = [];
const loadTrg: Trigger[] = [];
const isBusy: boolean[] = [];

// Use the first 3 index to protect the save being modified
function onSaveBegin(enc: SaveEncoder) {
	enc.addInt(1); // Game version
	enc.addInt(GetRandomInt(0, 9999));
	enc.addInt(StringHash(enc.owner.name));
}

function onSave(enc: SaveEncoder) {
	// Put every data needed here
}

function globalSave() {
	// Put every data that needed load every game
}

const dangerSymbol = {
	["<"]: true,
	[">"]: true,
	[":"]: true,
	["?"]: true,
	["|"]: true,
	["*"]: true,
	['"']: true,
	["/"]: true,
	["\\"]: true,
};

function safeConvert(str: string): string {
	let newVal = string.gsub(str, ".", (c) => {
		if (dangerSymbol[c]) return "";
	});
	if (newVal.length <= 4) {
		let cn = string.sub(str, 1, 3);
		if (cn == "LPT" || cn == "CON" || cn == "PRN" || cn == "AUX" || cn == "NUL") {
			return "saved-";
		}
	}
	return str;
}

function saveNormal() {
	const p = MapPlayer.fromEvent();
	const pId = p.id;
	if (isBusy[pId]) return; // The save is already in progress
	isBusy[pId] = true;

	const chatStr = GetEventPlayerChatString();
	const saveName = chatStr.length > 5 ? safeConvert(chatStr) + "-" : "saved-";
	const saveTo = BASE_PATH + "\\manual\\";
	globalSave();
	const encoder = new SaveEncoder(p);
	onSaveBegin(encoder);
	onSave(encoder);
	encoder.encode();
	const code = encoder.code;
	if (p.isLocal()) {
		PreloadGenClear();
		PreloadGenStart();
		Preload("--------------------------------------------------------");
		Preload("Player Name: " + p.name);
		Preload("Codes (-load):");
		for (let i = 1; i < code.length; i++) Preload(code[i]);
		// Preload("--------------------------------------------------------")s
		// Preload("Match played: " + OzGetPlayerMatch(player))
		// Preload("Match won: " + OzGetPlayerWin(player, 0))
		// Preload("N1 won: " + OzGetPlayerWin(player, 1))
		// Preload("N2 won: " + OzGetPlayerWin(player, 2))
		// Preload("N3 won: " + OzGetPlayerWin(player, 3))
		// Preload("N4 won: " + OzGetPlayerWin(player, 4))
		// Preload("N5 won: " + OzGetPlayerWin(player, 5))
		// Preload("N6 won: " + OzGetPlayerWin(player, 6))
		// Preload("N7 won: " + OzGetPlayerWin(player, 7))
		// Preload("N8 won: " + OzGetPlayerWin(player, 8))
		// Preload("N9 won: " + OzGetPlayerWin(player, 9))
		Preload("--------------------------------------------------------");
		// Preload("Total times played: " + OzGetPlayerTimePlay(player));
		// Preload("KEY PASS: " + key);
		Preload("SECURITY: " + Checksum.sum(p.name));
		PreloadGenEnd(saveTo + saveName + os.date("%Y%m%d%H%M%S", os.time()) + ".pld");
		DisplayTimedTextToPlayer(p.handle, 0, 0.5, 15, "Saved to" + saveTo + saveName)
	}
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, () => {
	saveTrg[0] = new Trigger();
	saveTrg[1] = new Trigger();
	loadTrg[0] = new Trigger();
	loadTrg[1] = new Trigger();
	for (let i = 0; i < bj_MAX_PLAYERS; i++) {
		let p = MapPlayer.fromIndex(i);
		saveTrg[0].registerPlayerChatEvent(p, CMD_REF + CHAT.saveNormal, false);
		saveTrg[1].registerPlayerChatEvent(p, CMD_REF + CHAT.saveAuto, false);
		loadTrg[0].registerPlayerChatEvent(p, CMD_REF + CHAT.loadNormal, false);
		loadTrg[1].registerPlayerChatEvent(p, CMD_REF + CHAT.loadAuto, false);
	}

	saveTrg[0].addAction(saveNormal);
});
