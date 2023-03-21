import BinaryStream from '../../shared/binarystream';
import Corner from './corner';

/**
 * war3map.w3e - the environment file.
 */
export default class War3MapW3e {
  version = 0;
  tileset = 'A';
  haveCustomTileset = 0;
  groundTilesets: string[] = [];
  cliffTilesets: string[] = [];
  mapSize = new Int32Array(2);
  centerOffset = new Float32Array(2);
  corners: Corner[][] = [];

  load(buffer: ArrayBuffer | Uint8Array): void {
    const stream = new BinaryStream(buffer);

    if (stream.readBinary(4) !== 'W3E!') {
      return;
    }

    this.version = stream.readInt32();
    this.tileset = stream.readBinary(1);
    this.haveCustomTileset = stream.readInt32();

    for (let i = 0, l = stream.readInt32(); i < l; i++) {
      this.groundTilesets[i] = stream.readBinary(4);
    }

    for (let i = 0, l = stream.readInt32(); i < l; i++) {
      this.cliffTilesets[i] = stream.readBinary(4);
    }

    stream.readInt32Array(this.mapSize);
    stream.readFloat32Array(this.centerOffset);

    for (let row = 0, rows = this.mapSize[1]; row < rows; row++) {
      this.corners[row] = [];

      for (let column = 0, columns = this.mapSize[0]; column < columns; column++) {
        const corner = new Corner();

        corner.load(stream);

        this.corners[row][column] = corner;
      }
    }
  }


  save(): Uint8Array {
    const stream = new BinaryStream(new ArrayBuffer(this.getByteLength()));

    stream.writeBinary('W3E!');
    stream.writeInt32(this.version);
    stream.writeBinary(this.tileset);
    stream.writeInt32(this.haveCustomTileset);
    stream.writeUint32(this.groundTilesets.length);

    for (const groundTileset of this.groundTilesets) {
      stream.writeBinary(groundTileset);
    }

    stream.writeUint32(this.cliffTilesets.length);

    for (const cliffTileset of this.cliffTilesets) {
      stream.writeBinary(cliffTileset);
    }

    stream.writeInt32Array(this.mapSize);
    stream.writeFloat32Array(this.centerOffset);

    for (const row of this.corners) {
      for (const corner of row) {
        corner.save(stream);
      }
    }

    return stream.uint8array;
  }

  getByteLength(): number {
    return 37 + (this.groundTilesets.length * 4) + (this.cliffTilesets.length * 4) + (this.mapSize[0] * this.mapSize[1] * 7);
  }
}
