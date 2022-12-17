export class OzMissile {
  private static readonly REFRESH_RATE = 1 / 40; // Update once every 40 frames
  private static readonly SWEET_SPOT = 300; // Maximum amount of missile to process
  private static readonly EXTRA_COLLISION = 128.0; // Number of additional collision added to checking
  private static readonly ITEM_COLLISION = 16.0; // Number of item collision added to checking
  private static readonly DUMMY_ID = FourCC("dumi");
  private static readonly DUMMY_ABIL = FourCC("Amrf");
  public source: unit;
  public target: unit;
  public owner: player;
  public prevX: number;
  public prevY: number;
  public x: number;
  public y: number;
  public nextX: number;
  public nextY: number;
  __constructor(source: unit, target: unit) {
    this.source = source;
    this.target = target;
    this.owner = GetOwningPlayer(source);
  }

  setLocation(x: number, y: number, toX: number, toY: number) {}
}
