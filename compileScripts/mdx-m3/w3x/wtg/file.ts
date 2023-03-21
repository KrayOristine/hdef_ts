import BinaryStream from '../../shared/binarystream';
import TriggerCategory from './triggercategory';
import Variable from './variable';
import Trigger from './trigger';
import { TriggerData } from './triggerdata';

/**
 * war3map.wtg - the trigger file.
 */
export default class War3MapWtg {
  version = 0;
  categories: TriggerCategory[] = [];
  u1 = 0;
  variables: Variable[] = [];
  triggers: Trigger[] = [];

  load(buffer: ArrayBuffer | Uint8Array, triggerData: TriggerData): void {
    const stream = new BinaryStream(buffer);

    if (stream.readBinary(4) !== 'WTG!') {
      throw new Error('Not a WTG file');
    }

    this.version = stream.readInt32();

    for (let i = 0, l = stream.readUint32(); i < l; i++) {
      const category = new TriggerCategory();

      category.load(stream, this.version);

      this.categories[i] = category;
    }

    this.u1 = stream.readInt32();

    for (let i = 0, l = stream.readUint32(); i < l; i++) {
      const variable = new Variable();

      variable.load(stream, this.version);

      this.variables[i] = variable;
    }

    for (let i = 0, l = stream.readUint32(); i < l; i++) {
      const trigger = new Trigger();

      try {
        trigger.load(stream, this.version, triggerData);
      } catch (e) {
        throw new Error(`Trigger ${i}: ${e}`);
      }

      this.triggers[i] = trigger;
    }
  }

  save(): Uint8Array {
    const stream = new BinaryStream(new ArrayBuffer(this.getByteLength()));

    stream.writeBinary('WTG!');
    stream.writeInt32(this.version);
    stream.writeUint32(this.categories.length);

    for (const category of this.categories) {
      category.save(stream, this.version);
    }

    stream.writeInt32(this.u1);
    stream.writeUint32(this.variables.length);

    for (const variable of this.variables) {
      variable.save(stream, this.version);
    }

    stream.writeUint32(this.triggers.length);

    for (const trigger of this.triggers) {
      trigger.save(stream, this.version);
    }

    return stream.uint8array;
  }

  getByteLength(): number {
    let size = 24;
    const version = this.version;

    for (const category of this.categories) {
      size += category.getByteLength(version);
    }

    for (const variable of this.variables) {
      size += variable.getByteLength(version);
    }

    for (const trigger of this.triggers) {
      size += trigger.getByteLength(version);
    }

    return size;
  }
}
