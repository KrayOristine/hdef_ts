import { Timer } from "w3ts";
import { addScriptHook, W3TS_HOOK } from "w3ts/hooks";
import * as core from "Core/index";
import * as libs from "Libs/index";
import * as utils from "Utils/index";
import * as trig from "Trigger/index";

const BUILD_DATE = compiletime(() => new Date().toUTCString());
const TS_VERSION = compiletime(() => require("typescript").version);
const TSTL_VERSION = compiletime(() => require("typescript-to-lua").version);

function tsMain() {
	print(`Build: ${BUILD_DATE}`);
	print(`Typescript: v${TS_VERSION}`);
	print(`Transpiler: v${TSTL_VERSION}`);
	print(" ");
	print("Welcome to TypeScript!");
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain);
