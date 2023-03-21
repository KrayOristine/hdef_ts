import BinaryStream from '../../shared/binarystream';
import Import from './import';

/**
 * war3map.imp - the import file.
 */
export default class War3MapImp {
  version = 1;
  entries: Map<string, Import> = new Map();

  load(buffer: ArrayBuffer | Uint8Array): void {
    const stream = new BinaryStream(buffer);

    this.version = stream.readUint32();

    for (let i = 0, l = stream.readUint32(); i < l; i++) {
      const entry = new Import();

      entry.load(stream);

      if (entry.isCustom) {
        this.entries.set(entry.path, entry);
      } else {
        this.entries.set(`war3mapimported\\${entry.path}`, entry);
      }
    }
  }

  save(): Uint8Array {
    const stream = new BinaryStream(new ArrayBuffer(this.getByteLength()));

    stream.writeUint32(this.version);
    stream.writeUint32(this.entries.size);

    for (const entry of this.entries.values()) {
      entry.save(stream);
    }

    return stream.uint8array;
  }

  getByteLength(): number {
    let size = 8;

    for (const entry of this.entries.values()) {
      size += entry.getByteLength();
    }

    return size;
  }

  set(path: string): boolean {
    if (!this.entries.has(path)) {
      const entry = new Import();

      entry.isCustom = 10;
      entry.path = path;

      this.entries.set(path, entry);

      return true;
    }

    return false;
  }

  has(path: string): boolean {
    return this.entries.has(path);
  }

  delete(path: string): boolean {
    return this.entries.delete(path);
  }

  rename(path: string, newPath: string): boolean {
    const entry = this.entries.get(path);

    if (entry) {
      entry.isCustom = 10;
      entry.path = newPath;

      return true;
    }

    return false;
  }
}
