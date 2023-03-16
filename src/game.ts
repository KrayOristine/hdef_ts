//import * as d from "modules/damage";
// import * as wex from "shared/WarEX";
//import { addScriptHook, W3TS_HOOK } from "w3ts/hooks";
//

const BUILD_DATE = compiletime(() => new Date().toUTCString());
const TS_VERSION = compiletime(() => require("typescript").version);
const TSTL_VERSION = compiletime(() => require("typescript-to-lua").version);

function tsMain() {
	print(`Build: ${BUILD_DATE}`);
	print(`Typescript: v${TS_VERSION}`);
	print(`Transpiler: v${TSTL_VERSION}`);
	print(" ");

  // Initialization should be here?
  // d.Init()
  // wex.Init();
  print(orderId.ORDER_ABSORB)
}

//addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain);
