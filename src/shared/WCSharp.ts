//import * as wts from "w3ts";
//import * as wex from "shared/WarEX";

/*
 *  Converted WCSharp library into ts
 */


//* WCSharp.Events

//* PeriodicEvent
interface PeriodicEvent {
  method?: Func<boolean>,
  interval: number;
  intervalLeft: number;
}

interface PeriodicDisposableAction {
  active: boolean;
  action: Func<void>;
  dispose: Func<void>;
}

const __pesInterval = 1 / 32;
const __pesList: PeriodicEvent[] = [];
const __pesStart = (actions: Func<void>) => {
  let obj = CreateTimer();
  TimerStart(obj, __pesInterval, true, actions);
  return obj;
}
const __pesTick = ()=>{
  let num = __pesList.length;
  let num2 = 0;
  while (num2 < num)
  {
    let event = __pesList[num2];
    num2++;
    event.intervalLeft -= 1.0 / 32.0;
    if (event.intervalLeft <= 0.0)
    {
      event.intervalLeft += event.interval;
      if (event.method && !event.method())
      {
        num--;
        num2--;
        __pesList[num2] = __pesList[num];
        //@ts-expect-error
        __pesList[num2] = null;
      }
    }
  }
}
const __pesTimer = __pesStart(__pesTick);

export class PeriodicDisposableTrigger<T extends PeriodicDisposableAction> {
  private readonly actions: T[];
  private readonly timerEvent: PeriodicEvent;
  private active: boolean

  constructor(period: number){
    this.actions = [];
    this.timerEvent = {
      method: this.periodic,
      interval: period,
      intervalLeft: period
    }
    this.active = false;
  }

  public add(trigger: T){
    if (!this.active){
      __pesList.push(this.timerEvent);
      this.active = true;
    }

    trigger.active = true;
    this.actions.push(trigger);
  }

  private periodic(){
    let num = this.actions.length;
    let num2 = 0;
    while (num2 < num)
    {
      let val = this.actions[num2];
      if (val.active)
      {
        val.action();
      }
      if (val.active)
      {
        num2++;
        continue;
      }
      num--;
      this.actions[num2] = this.actions[num];
      //@ts-expect-error
      this.actions[num] = null;
      val.dispose();
    }
    if (num == 0)
    {
      this.active = this.actions.length > 0;
    }
    return this.active;
  }
}
