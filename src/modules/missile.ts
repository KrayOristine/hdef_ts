import * as wex from "shared/WarEX";
import * as wb from "shared/worldBounds";

/*
 * Missile - copy pasted from WCSharp
*/
//! Missile System - DO NOT TOUCH
//TODO: Change from plain to use WCSharp ways (PeriodicDisposableTrigger)
//* Will be previewed, as if it affect performance

let _missileList: Missile[] = [];
let _timer: timer;
let isActive = false;

function __onPeriodic(){
  let n = _missileList.length;
  let n2 = 0;
  while (n2 < n){
    let ms = _missileList[n2];
    if (ms.active) ms.action();
    if (ms.active){
      n2++;
      continue;
    }
    n--;
    _missileList[n2] = _missileList[n];
    //@ts-expect-error
    _missileList[n] = null;
    ms.runDispose();
    if (n == 0){
      isActive = _missileList.length > 0;
    }
  }
}

function __i_addPeriodic<T extends Missile>(ms: T){
  if (_timer == null){
    _timer = CreateTimer()
  }
  if (!isActive){
    _missileList.push(ms);
    TimerStart(_timer, 1 / 40.0, true, __onPeriodic);
    isActive = true;
  }

  ms.active = true;
}

/**
 * Call this function to begin run the missile
 */
export function AddToSystem<T extends Missile>(ms: T){
  ms.launch();
  __i_addPeriodic(ms);
  ms.action();
}


/**
 * Fundamental class that have properties and shared method for all missile
 *
 * You should extend this class if you want to implements your own movement
 */
export abstract class Missile {
  protected _effectPath: string = "";
  protected _effectScale: number = 0;
  protected _missileZ: number = 0;
  protected _casterZ: number = 0;
  protected _targetZ: number = 0;
  protected _launchZ: number = 0;
  protected _speed: number = 0;
  protected _collisionRadius: number = 0;
  protected _group?: group;
  protected _spinPeriod: number = 0;
	protected _yaw: number = 0;
	protected _pitch: number = 0;
	protected _roll: number = 0;
  protected _effect?: effect;

  /**
   * Boolean value that indicate whether the missile is currently running or 'dead'
   */
  public active: boolean = false;
  public caster: unit;

  /**
   * This will not be updated when the caster is changed or it owner changed
   */
  public casterOwner: player;
  public casterX: number;
  public casterY: number;
  public get casterZ() {
    return this._casterZ + wex.GetZ(this.casterX, this.casterY);
  }
  public set casterZ(value: number) {
    this._casterZ = value - wex.GetZ(this.casterX, this.casterY);
  }
  public get launchZ(){
    return this._launchZ;
  }

  public target?: unit;

  /**
   * This will not be updated when the target is changed or it owner changed
   */
  public targetOwner?: player;
  public targetX: number = 0;
  public targetY: number = 0;
  public get targetZ(): number{
    return this._targetZ + wex.GetZ(this.targetX, this.targetY);
  };
  public set targetZ(value: number){
    this._targetZ = value - wex.GetZ(this.targetX, this.targetY);
  }
  public targetImpactZ: number = 0;
  public missileX: number = 0;
  public missileY: number = 0;
  public get missileZ(): number {
    return this._missileZ + wex.GetZ(this.missileX, this.missileY);
  }
  public set missileZ(value: number) {
    this._missileZ = value - wex.GetZ(this.missileX, this.missileY);
  }

  public get speed(){
    return this._speed / (1 / 40.0);
  }
  public set speed(value: number) {
    this._speed = value * 1 / 40.0;
  }
  public impactLeeway: number = 0;
  public targetHits?: Set<unit>;

  public get collisionRadius(){
    return this._collisionRadius;
  }

  /**
   * Set this value to anything greater than 0 to enable
   * collision usage
   */
  public set collisionRadius(value: number) {
    this._collisionRadius = Math.max(0.0, value);
    if (value > 0 && this.targetHits == null){
      this.targetHits = new Set<unit>();
      this._group = CreateGroup() as group;
    }
  }

  public interval: number = 0;
  public intervalLeft: number = 0;

  // These section contains pre-computed code for light-weight when handling a tons of missile
  public get spinPeriod(): number {
    if (this._spinPeriod != 0) return Math.PI / 16 / this._spinPeriod; // pre-computed (Math.pi / 16 / value)

    return 0;
  }
  public set spinPeriod(value: number){
    this._spinPeriod = (value != 0 ? Math.PI / 16 / value : 0);
  }
  public get yaw()
  {
    return this._yaw * (180 / Math.PI); // pre-computed (180 / math.pi)
  }
  public set yaw(value: number)
  {
    this._yaw = value * (Math.PI / 180); // pre-computed (math.pi / 180)
  }
  public get currentAngle()
  {
    return this._yaw * (180 / Math.PI); // pre-computed (180 / math.pi)
  }
  public set currentAngle(value: number)
  {
    this._yaw = value * (Math.PI / 180); // pre-computed (math.pi / 180)
  }
  public get pitch(){
    return this._pitch * (180 / Math.PI); // pre-computed (180 / math.pi)
  }
  public set pitch(value: number){
    this._pitch = value * 0.01745329453 // pre-computed (math. pi / 180)
  }
  public get roll(){
    return this._roll * (180 / Math.PI); // pre-computed (180 / math.pi)
  }
  public set roll(value: number){
    this._roll = value * 0.01745329453 // pre-computed (math. pi / 180)
  }
  public get effectString() { return this._effectPath; }
  public set effectString(value: string){
    if (this._effectPath == value) return;
    if (this.active){
      if (this._effect != null)
      {
        DestroyEffect(this._effect);
      }
      if (value != "")
      {
        this._effect = AddSpecialEffect(value, this.missileX, this.missileY) as effect;
        BlzSetSpecialEffectZ(this._effect, this.missileZ);
        BlzSetSpecialEffectOrientation(this._effect, this._yaw, this._pitch, this._roll);
        if (this._effectScale != 1)
        {
          BlzSetSpecialEffectScale(this._effect, this._effectScale);
        }
      }
    }
    this._effectPath = value;
  }
  public get effectScale(){
    if (this._effect != null) return BlzGetSpecialEffectScale(this._effect);
    return this._effectScale;
  }
  public set effectScale(value){
    if (this._effect != null){
      BlzSetSpecialEffectScale(this._effect, value);
    }
    this._effectScale = value;
  }

  public constructor(casterX: number, casterY: number, casterUnit: unit, targetX?: number, targetY?: number, targetUnit?: unit){
    this.casterX = casterX;
    this.casterY = casterY;
    this.caster = casterUnit;
    this.casterOwner = GetOwningPlayer(casterUnit);
    this.targetX = targetX ?? 0;
    this.targetY = targetY ?? 0;
    this.target = targetUnit ?? undefined;
  }

  /**
   * This is a core function, which will be called every time the missile launch
   *
   * Do not call it directly or infinite loop may happen
   *
   * @note What the missile will do once launched
   * @abstract Must be overridden by derived class
   */
  public abstract launch(): void;

  /**
   * This is a core function, which will be called every period
   *
   * Do not call it directly or infinite loops will happen
   *
   * @note What the missile will do every period
   * @abstract Must be overridden by derived class
   */
  public abstract action(): void;

  /**
   * Will be called by system!, DO NOT CALL IT BY YOURSELF
   *
   * @abstract - Override this if your missile has an trigger on collision
   * - For this to work, missile must have it collision property assigned
   * @override
   * @note There is no filter on which target it collide on
   *
   * @see collisionRadius
   */
  protected onCollisions?(target: unit): void;

  /**
   * Will be called by system!, DO NOT CALL IT BY YOURSELF
   *
   * @abstract Override this if your missile has an periodic effect
   * @override
   * @note This will only work if interval is larger than 0
   * @see interval
   */
  protected onPeriodic?(): void;

  /**
   * Will be called by system!, DO NOT CALL IT BY YOURSELF
   *
   * @abstract Override this if your missile has an impact effect
   * @override
   * @note The missile active will be set to false prior to calling this method, you must
   * set it to true if you want the missile still be active
   *
   * @see active
   */
  protected onImpact?(): void;

  /**
   * Will be called by system!, DO NOT CALL IT BY YOURSELF
   *
   * @abstract Override this if your missile has to run when destroyed
   * @override
   * @note This will be called every time the missile is destroyed
   */
  protected onDispose?(): void;

  protected exitWorldBounds()
	{
		if (this._effect != null)
		{
			this.missileX = BlzGetLocalSpecialEffectX(this._effect);
			this.missileY = BlzGetLocalSpecialEffectY(this._effect);
			this.missileZ = BlzGetLocalSpecialEffectZ(this._effect);
		}
		if (this.interval > 0) this.runInterval();
		if (this._collisionRadius > 0) this.runCollisions();
		this.active = false;
		this.onImpact && this.onImpact();
	}

  protected runInterval(){
    this.intervalLeft -= 1 / 40.0;
		if (this.intervalLeft <= 0)
		{
			this.intervalLeft += this.interval;
			this.onPeriodic && this.onPeriodic();
		}
  }

  protected runCollisions(){
    wex.GroupEnumUnitInRange(this._group!, this.missileX, this.missileY, this._collisionRadius);
    let size = BlzGroupGetSize(this._group!);
    if (size <= 0) return;

    for (const i of $range(0, size)){
      let u = BlzGroupUnitAt(this._group!, i);
      if (!u) continue;

      if (this.targetHits && this.targetHits.has(u)){
        this.targetHits.add(u);
        this.onCollisions && this.onCollisions(u);
      }
    }
  }

  protected runImpact(){
    this.missileX = this.targetX;
		this.missileY = this.targetY;
		this.missileZ = this.targetZ;
    if (this._effect) {
      BlzSetSpecialEffectPosition(this._effect, this.missileX, this.missileY, this.missileZ);
      BlzSetSpecialEffectPitch(this._effect, 0);
    }
		if (this.interval > 0) this.runInterval();
		if (this._collisionRadius > 0) this.runCollisions();

		this.active = false;
		this.onImpact && this.onImpact();
  }

  /**
   * SYSTEM INTERNAL, DO NOT CALL THIS
   */
  public runDispose() {
    this.onDispose && this.onDispose();

    if (this._effect != null) DestroyEffect(this._effect);
    if (this._group != null) DestroyGroup(this._group);
  }

  /**
   * This is a shorthand for firing a given missile instead of doing
   *
   * ```ts
   *  const ms = new Missile();
   *
   * //... configuration, etc.
   *
   *  AddToSystem(ms)
   * ```
   */
  public cast(){
    AddToSystem(this);
  }
}


/**
 * A very basic missile that will go from A to B
 *
 * This missile can Arc
 */
export abstract class BasicMissile extends Missile {
  private _followTerrain: boolean = false;
  private _distanceToTarget: number = 0;

  public override get casterZ(){
    if (!this._followTerrain) return this._casterZ;

    return this._casterZ + wex.GetZ(this.casterX, this.casterY);
  }

  public override set casterZ(value: number){
    this._casterZ = (this._followTerrain ? (value - wex.GetZ(this.casterX, this.casterY)) : value);
  }

  public override get targetZ(){
    if (!this._followTerrain) return this._targetZ;

    return this._targetZ + wex.GetZ(this.targetX, this.targetY);
  }

  public override set targetZ(value: number){
    this._targetZ = (this._followTerrain ? (value - wex.GetZ(this.targetX, this.targetY)) : value);
  }

  public override get missileZ(){
    if (!this._followTerrain) return this._missileZ;

    return this._missileZ + wex.GetZ(this.missileX, this.missileY);
  }

  public override set missileZ(value: number){
    this._missileZ = (this._followTerrain ? (value - wex.GetZ(this.missileX, this.missileY)) : value);
  }

  /**
   * Missile arc, closely match Object Editor values
   *
   * If you want a fixed height arc, set the Arc equal to (arc height/distance to target).
   */
  public arc: number = 0;

  public reactiveArc(){
    if (!this._followTerrain && this.arc == 0) return;

    this._followTerrain = false;
    this.targetZ += wex.GetZ(this.targetX, this.targetY);
    this.missileZ += wex.GetZ(this.missileX, this.missileY);
    this.casterX = this.missileX;
    this.casterY = this.missileY;
    this.casterZ = this.missileZ;
    this._launchZ = 0;
    this._distanceToTarget = wex.DistanceBetweenPoints(this.casterX, this.casterY, this.targetX, this.targetY);
  }

  public disableArc(){
    if (this._followTerrain) return;

    this._followTerrain = true;
    this.casterZ -= wex.GetZ(this.casterX, this.casterY);
    this.targetZ -= wex.GetZ(this.targetX, this.targetY);
    this.missileZ -= wex.GetZ(this.missileX, this.missileY);
  }

  constructor(casterX: number, casterY: number, casterUnit: unit, targetX?: number, targetY?: number, targetUnit?: unit){
    super(casterX, casterY, casterUnit, targetX, targetY, targetUnit);
  }

  /**
   * DO NOT OVERRIDE THIS METHOD!
   *
   * @ignore
   */
  public override launch(): void {
    this._casterZ += this._launchZ;
    this._targetZ += this.targetImpactZ;
    this._followTerrain = this._casterZ < 300 && this.arc == 0;
    this._distanceToTarget = wex.DistanceBetweenPoints(this.casterX, this.casterY, this.targetX, this.targetY);
    if (this._followTerrain){
      this._casterZ += wex.GetZ(this.casterX, this.casterY);
      this._targetZ += wex.GetZ(this.targetX, this.targetY);
    }
    this.missileX = this.casterX;
    this.missileY = this.casterY;
    this.missileZ = this.casterZ;
    this.intervalLeft = this.interval;

    if (this._effectPath.length > 0){
      this._effect = AddSpecialEffect(this._effectPath, this.missileX, this.missileY) as effect;
      BlzSetSpecialEffectZ(this._effect, this.missileZ);
      if (this._effectScale != 1) BlzSetSpecialEffectScale(this._effect, this._effectScale);
    }
  }

  /**
   * DO NOT OVERRIDE THIS METHOD!
   *
   * @ignore
   */
  public override action(){
    if (this.target != null){
      if (UnitAlive(this.target)){
        this.targetX = GetUnitX(this.target);
        this.targetY = GetUnitY(this.target);
        this.targetZ = GetUnitFlyHeight(this.target) + this.targetImpactZ;
        if (this._followTerrain) this.targetZ += wex.GetZ(this.targetX, this.targetY);
      } else {
        this.target = undefined;
      }
    }

    if (wex.DistanceBetweenPoints(this.missileX, this.missileY, this.targetX, this.targetY) < this.speed + this.impactLeeway) return this.runImpact();


    const num = this.missileZ;
    if (this._followTerrain){
      this.missileZ += (this.targetZ - this.missileZ) * (this.speed / wex.DistanceBetweenPoints(this.missileX, this.missileY, this.targetX, this.targetY))
    } else {
      const num2 = wex.DistanceBetweenPoints(this.casterX, this.casterY, this.targetX, this.targetY);
      if (Math.abs(this._distanceToTarget - num2) > 50){
        this.disableArc();
      } else {
        this._distanceToTarget = num2;
        const num3 = wex.DistanceBetweenPoints(this.casterX, this.casterY, this.missileX, this.missileY) / num2;
        this.missileZ = this.casterZ + num3 * (this.targetZ - this.casterZ) + num2 * this.arc * Math.sin(num3 * Math.PI);
      }
    }
    this.yaw = wex.AngleBetweenPointsRadD(this.missileX, this.missileY, this.targetX, this.targetY);
    const num4 = this.speed * Math.cos(this.yaw);
    const num5 = this.speed * Math.sin(this.yaw)
    this.missileX += num4;
    this.missileY += num5;

    if (wb.WorldBounds.containsXY(this.missileX, this.missileY)) return this.exitWorldBounds();

    if (this._effect != null){
      this.roll += this.spinPeriod;
      const num6 = this.missileZ;
      this.pitch = Math.atan2(num - num6, Math.sqrt(num4 * num4 + num5 * num5));
      BlzSetSpecialEffectPosition(this._effect, this.missileX, this.missileY, num6);
			BlzSetSpecialEffectOrientation(this._effect, this.yaw, this.pitch, this.roll);
    }

    if (this.interval > 0) this.runInterval();

    if (this._collisionRadius > 0) this.runCollisions();
  }
}

/**
 *  Homing missile with a fixed speed that will attempt to aim itself at the target, restricted by turn speed.
 *
 *  Note: Does not have any behaviour to avoid endlessly circling the enemy.
 *  I recommend using it with a collision radius or such so that exact collisions aren't required.
 */
export abstract class HomingMissile extends Missile {
  private _turnRate: number;

  public get turnRate(): number {
    console.log("taejhaetjaetj");
    return this._turnRate * (180 / Math.PI) / (1 / 32);
  }
  public set turnRate(value: number){
    this._turnRate = value * (Math.PI / 180) * (1 / 32)
    console.log("testsethathaetj");
  }

  public initialAngle?: number;

  constructor(casterX: number, casterY: number, casterUnit: unit, targetX?: number, targetY?: number, targetUnit?: unit){
    super(casterX, casterY, casterUnit, targetX, targetY, targetUnit);
    this._turnRate = 0;
  }

  /**
   * DO NOT OVERRIDE THIS METHOD!
   *
   * @ignore
   */
  public override launch(): void {
    this.casterZ += this._launchZ;
		this.targetZ += this.targetImpactZ;
		this.missileX = this.casterX;
		this.missileY = this.casterY;
		this.missileZ = this.casterZ;
    if (this.initialAngle == null) {
      this.yaw = wex.AngleBetweenPointsRadD(this.casterX, this.casterY, this.targetX, this.targetY)
    } else {
      this.yaw = this.initialAngle * (Math.PI / 180)
      if (this.yaw < 0) this.yaw += Math.PI * 2;
			else if (this.yaw > Math.PI * 2) this.yaw -= Math.PI * 2;
    }

    this.intervalLeft = this.interval;
		if (this._effectPath != "")
		{
			this._effect = AddSpecialEffect(this._effectPath, this.missileX, this.missileY) as effect;
			BlzSetSpecialEffectZ(this._effect, this.missileZ);
			if (this.effectScale != 1)
			{
				BlzSetSpecialEffectScale(this._effect, this.effectScale);
			}
		}
  }

  /**
   * DO NOT OVERRIDE THIS METHOD!
   *
   * @ignore
   */
  public override action(){
		if (this.target != null)
		{
			if (UnitAlive(this.target)){
				this.targetX = GetUnitX(this.target);
				this.targetY = GetUnitY(this.target);
				this.targetZ = GetUnitFlyHeight(this.target) + this.targetImpactZ;
			} else {
				this.target = undefined;
			}
		}
		if (wex.DistanceBetweenPoints(this.missileX, this.missileY, this.targetX, this.targetY) < this.speed + this.impactLeeway){
			return this.runImpact();
		}

    let num = this.missileZ;
		let num2 = wex.AngleBetweenPointsRadD(this.missileX, this.missileY, this.targetX, this.targetY);

    if (Math.abs(num2 - this.yaw) < this.turnRate) this.yaw = num2;
		else if ((this.yaw < num2 && num2 < this.yaw + Math.PI) || num2 < this.yaw - Math.PI) this.yaw += this.turnRate;
		else this.yaw -= this.turnRate;

		if (this.yaw < 0) this.yaw += Math.PI * 2;
		else if (this.yaw > Math.PI * 2) this.yaw -= Math.PI * 2;

		let num3 = this.speed * Cos(this.yaw);
		let num4 = this.speed * Sin(this.yaw);
		this.missileX += num3;
		this.missileY += num4;
		this.missileZ += (this.targetZ - this.missileZ) * (this.speed / wex.DistanceBetweenPoints(this.missileX, this.missileY, this.targetX, this.targetY));
		if (!wb.WorldBounds.containsXY(this.missileX, this.missileY)){
			this.exitWorldBounds();
			return;
		}
		if (this._effect != null){
			this.roll += this.spinPeriod;
			let num5 = this.missileZ;
			this.pitch = Atan2(num - num5, SquareRoot(num3 * num3 + num4 * num4));
			BlzSetSpecialEffectPosition(this._effect, this.missileX, this.missileY, num5);
			BlzSetSpecialEffectOrientation(this._effect, this.yaw, this.pitch, this.roll);
		}
		if (this.interval > 0) this.runInterval();
		if (this.collisionRadius > 0) this.runCollisions();
  }
}
