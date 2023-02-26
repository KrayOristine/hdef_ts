//! THIS IS A LIBRARY FOR PROTECTING YOUR NUMBERIC VALUE

//* These will slow down the performance as always as any anti cheat will be

function trunc(v: number) {
  return v + (2 ** 52 + 2 ** 51) - (2 ** 52 + 2 ** 51);
}

export class ObscuredInt {
  private data: string; // A data string that contain the value to be use
  private epsilon: number; // A fake value for cheater to edit
  constructor(v: number) {
    //* Warn, only safe and reversible with number BELOW 2147483647 to add more range just simply add one more f to the 0x7f..

    this.data = (~v & 0x7fffffff).toString(36); // inverse bit, then and bit with 2147483647
    this.epsilon = v;
  }

  get truth() {
    //* If the above got more f, please also put f in here!
    let t = 0x7fffffff ^ parseInt(this.data, 36);

    if (this.epsilon != t) {
      // Yep, cheater detected do something with him!
    }

    return t;
  }

  set val(v: number) {
    //* Like above, if the constructor got more f, please put more in here also.
    this.data = (~v & 0x7fffffff).toString(36);
    this.epsilon = v;
  }
}

// Like above but for usage with float
export class ObscuredFloat {
  private data: string;
  private epsilon: number;

  constructor(v: number) {
    //* Because of the conversion, it is only safe and reversible with number below 214748.3647
    this.data = (trunc(v * 10000) ^ 0x7fffffff).toString(32);
    this.epsilon = trunc(v * 10000) / 10000;
  }

  get truth() {
    //* If the above got more f, please also put f in here!
    let t =
      parseFloat((0x7fffffff ^ parseInt(this.data, 32)).toString()) / 10000;

    if (this.epsilon != t) {
      // Yep, cheater detected, do something with him
    }

    return t;
  }

  set val(v: number) {
    //* Like above, if the constructor got more f, please put more in here also.
    this.data = (trunc(v * 10000) ^ 0x7fffffff).toString(32);
  }
}

export class ObscuredBool {
  private data: string;

  private epsilon: number;

  constructor(v: boolean) {
    let n = v ? 1 : 0; // Convert it into number literal
    // Since it only 1 or 0, let make it godly
    this.data = ((n << 3) ^ 0xff).toString(32);
    this.epsilon = n;
  }

  get truth() {
    let t = (parseInt(this.data, 32) ^ 0xff) >>> 3;
    // if (t != this.epsilon){
    //     // Yep, cheater detected, do something with him
    // }

    return t; // Is is true or it was false
  }

  set val(v: boolean) {
    let n = v ? 1 : 0;
    this.data = ((n << 3) ^ 0xff).toString(32);
    this.epsilon = n;
  }
}

export class ObscuredIntArray {
  private data: ObscuredInt[];

  constructor(d: number[]) {
    this.data = [];

    if (d.length === 0) return;

    for (let v of d) {
      this.data.push(new ObscuredInt(v));
    }
  }

  fromIndex(i: number): number {
    return this.data[i].truth || 0;
  }

  setIndex(i: number, v: number) {
    if (this.data[i]) {
      this.data[i].val = v;
      return;
    }

    this.data[i] = new ObscuredInt(v);
  }
}

export class ObscuredFloatArray {
  private data: ObscuredFloat[];

  constructor(d: number[]) {
    this.data = [];

    if (d.length === 0) return;

    for (let v of d) {
      this.data.push(new ObscuredFloat(v));
    }
  }

  fromIndex(i: number): number {
    return this.data[i].truth || 0.0;
  }

  setIndex(i: number, v: number) {
    if (this.data[i]) {
      this.data[i].val = v;
      return;
    }

    this.data[i] = new ObscuredFloat(v);
  }
}
