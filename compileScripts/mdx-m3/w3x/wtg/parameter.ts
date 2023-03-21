import BinaryStream from '../../shared/binarystream';
import { byteLengthUtf8 } from '../../shared/utf8';
import SubParameters from './subParameters';
import { TriggerData } from './triggerdata';

/**
 * A function parameter. Can be a function itself, in which case it will have a SubParameters structure.
 */
export default class Parameter {
  type = 0;
  value = '';
  subParameters: SubParameters | null = null;
  u1 = 0;
  isArray = 0;
  arrayIndex: Parameter | null = null;

  load(stream: BinaryStream, version: number, triggerData: TriggerData): void {
    this.type = stream.readInt32();

    if (this.type < -1 || this.type > 3) {
      throw new Error(`Parameter: Bad type: ${this.type}`);
    }

    this.value = stream.readNull();

    if (stream.readInt32()) {
      const subParameters = new SubParameters();

      try {
        subParameters.load(stream, version, triggerData);
      } catch (e) {
        throw new Error(`Parameter "${this.value}": SubParameters ${e}`);
      }

      this.subParameters = subParameters;
    }

    if ((version === 4 && this.type === 2) || (version === 7 && this.subParameters)) {
      this.u1 = stream.readInt32();
    }

    if ((version === 4 && this.type !== 2) || version === 7) {
      this.isArray = stream.readInt32();
    }

    if (this.isArray) {
      const arrayIndex = new Parameter();

      try {
        arrayIndex.load(stream, version, triggerData);
      } catch (e) {
        throw new Error(`Parameter "${this.value}": ArrayIndex: ${e}`);
      }

      this.arrayIndex = arrayIndex;
    }
  }

  save(stream: BinaryStream, version: number): void {
    stream.writeInt32(this.type);
    stream.writeNull(this.value);

    if (this.subParameters) {
      stream.writeInt32(1);
      this.subParameters.save(stream, version);
    } else {
      stream.writeInt32(0);
    }

    if ((version === 4 && this.type === 2) || (version === 7 && this.subParameters)) {
      stream.writeInt32(this.u1);
    }

    if ((version === 4 && this.type !== 2) || version === 7) {
      stream.writeInt32(this.isArray);
    }

    if (this.isArray && this.arrayIndex) {
      this.arrayIndex.save(stream, version);
    }
  }

  getByteLength(version: number): number {
    let size = 9 + byteLengthUtf8(this.value);

    if (this.subParameters) {
      size += this.subParameters.getByteLength(version);
    }

    if ((version === 4 && this.type === 2) || (version === 7 && this.subParameters)) {
      size += 4;
    }

    if ((version === 4 && this.type !== 2) || version === 7) {
      size += 4;
    }

    if (this.isArray && this.arrayIndex) {
      size += this.arrayIndex.getByteLength(version);
    }

    return size;
  }
}
