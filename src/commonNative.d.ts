/** @noSelfInFile **/

declare function BlzQueueImmediateOrderById      (whichUnit: unit, order: number ): boolean;
declare function BlzQueuePointOrderById          (whichUnit: unit, order: number, x: number, y: number ): boolean;
declare function BlzQueueTargetOrderById         (whichUnit: unit, order: number, targetWidget: widget ): boolean;
declare function BlzQueueInstantPointOrderById   (whichUnit: unit, order: number, x: number, y: number, instantTargetWidget: widget ): boolean;
declare function BlzQueueInstantTargetOrderById  (whichUnit: unit, order: number, targetWidget: widget, instantTargetWidget: widget ): boolean;
declare function BlzQueueBuildOrderById          (whichPeon: unit, unitId: number, x: number, y: number ): boolean;
declare function BlzQueueNeutralImmediateOrderById   (forWhichPlayer: player, neutralStructure: number, unitId: number ): boolean;
declare function BlzQueueNeutralPointOrderById       (forWhichPlayer: player, neutralStructure: number, unitId: number, x: number, y: number ): boolean;
declare function BlzQueueNeutralTargetOrderById      (forWhichPlayer: player, neutralStructure: number, unitId: number, target: widget ): boolean;