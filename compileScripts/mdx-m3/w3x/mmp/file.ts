import BinaryStream from '../../shared/binarystream';
import MinimapIcon from './minimapIcon';

/**
 * war3map.mmp - the minimap icon file.
 */
export default class War3MapMmp {
  u1 = 0;
  icons: MinimapIcon[] = [];

  load(buffer: ArrayBuffer | Uint8Array): void {
    const stream = new BinaryStream(buffer);

    this.u1 = stream.readInt32();

    for (let i = 0, l = stream.readInt32(); i < l; i++) {
      const icon = new MinimapIcon();

      icon.load(stream);

      this.icons[i] = icon;
    }
  }

  save(): Uint8Array {
    const stream = new BinaryStream(new ArrayBuffer(this.getByteLength()));

    stream.writeInt32(this.u1);
    stream.writeUint32(this.icons.length);

    for (const icon of this.icons) {
      icon.save(stream);
    }

    return stream.uint8array;
  }

  getByteLength(): number {
    return 8 + this.icons.length * 16;
  }
}
