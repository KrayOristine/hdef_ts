/* eslint-disable @typescript-eslint/no-unused-vars */

// prepare shared import (since they are the shared across all other modules/trigger and scripts)

import * as h from "shared/hooks";
import * as js from "shared/jsNative";
import * as lg from "shared/Logger";
import * as wb from "shared/worldBounds";
import * as wex from "shared/WarEX";
import * as ll from "shared/LinkedList";

// prepare modules import

import * as d from "modules/damage";
import * as ms from "modules/missile";
import * as ns from "modules/noise";


const BUILD_DATE = compiletime(() => new Date().toUTCString());
const TS_VERSION = compiletime(() => require("typescript").version);
const TSTL_VERSION = compiletime(() => require("typescript-to-lua").version);

function tsMain() {
	print(`Build Date: ${BUILD_DATE}`);
	print(`Typescript: v${TS_VERSION}`);
	print(`Transpiler: v${TSTL_VERSION}`);
	print(" ");
}

h.final(tsMain);
