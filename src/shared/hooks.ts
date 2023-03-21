/*
 * A Init helper
*/

const oldMain = main;
const oldConfig = config;
const oldGlobal = InitGlobal;
const oldTrig = InitCustomTriggers;
const oldInit = RunInitializationTriggers;
const oldStart = MarkGameStarted;
const hooksTable: Func<void>[][] = [[],[],[],[],[],[],[],[]];
const errorStack: string[] = [];

function safeRun(tbl: Func<void>[]){
  for (const i of $range(0, tbl.length)){
    const result = pcall(tbl[i]);

    if (!result[0]) errorStack.push(result[1]);
  }
}

_G.main = function(){
  safeRun(hooksTable[4])
  oldMain()
  safeRun(hooksTable[5])
}

_G.config = function(){
  safeRun(hooksTable[6])
  oldConfig();
  safeRun(hooksTable[7])
}

_G.InitGlobal = function(){
  oldGlobal();
  safeRun(hooksTable[0])
}

_G.InitCustomTriggers = function(){
  oldTrig();
  safeRun(hooksTable[1])
}

_G.RunInitializationTriggers = function(){
  oldInit();
  safeRun(hooksTable[2])
}

_G.MarkGameStarted = function(){
  oldStart();
  safeRun(hooksTable[3])
  if (errorStack.length > 0){
    for (const i of $range(0, errorStack.length)){
      print(errorStack[i]);
    }
  }
}




export function global(func: Func<void>){
  hooksTable[0].push(func);
}

export function trigger(func: Func<void>){
  hooksTable[1].push(func);
}

export function map(func: Func<void>){
  hooksTable[2].push(func);
}

export function final(func: Func<void>){
  hooksTable[3].push(func);
}

// for nerds

export function mainBefore(func: Func<void>){
  hooksTable[4].push(func)
}

export function mainAfter(func: Func<void>){
  hooksTable[5].push(func)
}

export function configBefore(func: Func<void>){
  hooksTable[6].push(func);
}

export function configAfter(func: Func<void>){
  hooksTable[7].push(func);
}
