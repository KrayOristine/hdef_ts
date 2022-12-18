import "war3-types/core/common";
import { Unit } from "w3ts";

declare function SetUnitZ(whichUnit: Unit, newZ: number): void;
declare function LocGetZ(atX: number, atY: number): number;
declare function FastCC(s: string): number;
declare function UnitGetZ(whichUnit: Unit): number;
