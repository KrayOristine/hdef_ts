import BinaryStream from '../../shared/binarystream';
import { byteLengthUtf8 } from '../../shared/utf8';

/**
 * A Trigger category.
 *
 * Used to scope triggers together in a Folder-like hierarchy.
 */
export default class TriggerCategory {
  id = 0;
  name = '';
  isComment = 0;

  load(stream: BinaryStream, version: number): void {
    this.id = stream.readInt32();
    this.name = stream.readNull();

    if (version === 7) {
      this.isComment = stream.readInt32();
    }
  }

  save(stream: BinaryStream, version: number): void {
    stream.writeInt32(this.id);
    stream.writeNull(this.name);

    if (version === 7) {
      stream.writeInt32(this.isComment);
    }
  }

  getByteLength(version: number): number {
    let size = 5 + byteLengthUtf8(this.name);

    if (version === 7) {
      size += 4;
    }

    return size;
  }
}
