import { Point, Trigger, Timer, Group } from "w3ts";

/*
  * Introduce to you a missile system that is virtually a copy-paste
  * of the Chopinski missile system and mixed with C# Missile System
  *
  * This version have everything this maps needs
*/

const location = new Point(0,0);
const timer = new Timer();
const dummy = 1685417321; // 'dumi'
const PERIOD = 1 / 40.0; // This is the interval of every operation

/**
 * Fundamental class that have properties and shared method for all missile
 */
export abstract class Missile {
  protected _effectPath: string;
  protected _effectScale: number;
  protected _missileZ: number;
  protected _casterZ: number;
  protected _targetZ: number;
  protected _launchZ: number;
  protected _speed: number;
  protected _collisionRadius: number;
  protected _group: group;
  protected _spinPeriod: number;
	protected _yaw: number;
	protected _pitch: number;
	protected _roll: number;
  protected _effect: Nullable<effect>;

  public active: boolean;
  public caster: unit;
  public casterOwner: player;
  public casterX: number;
  public casterY: number;
  public get casterZ() {
    location.setPosition(this.casterX, this.casterY);
    return this._casterZ + location.z;
  }
  public set casterZ(value: number) {
    location.setPosition(this.casterX, this.casterY);
    this._casterZ = value - location.z;
  }
  public get launchZ(){
    return this._launchZ;
  }

  public target: unit;
  public targetOwner: player;
  public targetX: number;
  public targetY: number;
  public get targetZ(): number{
    location.setPosition(this.targetX, this.targetY);
    return this._targetZ + location.z;
  };
  public set targetZ(value: number){
    location.setPosition(this.targetX, this.targetY);
    this._targetZ = value - location.z;
  }
  public targetImpactZ: number;

  public missileX: number;
  public missileY: number;
  public get missileZ(): number {
    location.setPosition(this.missileX, this.missileY);
    return this._missileZ + location.z;
  }
  public set missileZ(value: number) {
    location.setPosition(this.missileX, this.missileY);
    this._missileZ = value - location.z;
  }
  public get speed(){
    return this._speed / (PERIOD);
  }
  public set speed(value: number) {
    this._speed = value * PERIOD;
  }
  public impactLeeway: number;
  public get collisionRadius(){
    return this._collisionRadius;
  }
  public targetHits: Set<unit>;
  public set collisionRadius(value: number) {
    this._collisionRadius = Math.max(0.0, value);
    if (value > 0 && this.targetHits == null){
      this.targetHits = new Set<unit>();
      this._group = CreateGroup() as group;
    }
  }

  public interval: number;
  public intervalLeft: number;

  // These section contains pre-computed code for light-weight when handling a tons of missile
  public get spinPeriod(): number {
    if (this._spinPeriod != 0) return 0.196349541 / this._spinPeriod; // pre-computed (Math.pi / 16 / value)

    return 0;
  }
  public set spinPeriod(value: number){
    this._spinPeriod = (value != 0 ? 0.196349541 / value : 0);
  }
  public get yaw()
  {
    return this._yaw * 57.2957795; // pre-computed (180 / math.pi)
  }
  public set yaw(value: number)
  {
    this._yaw = value * 0.0174532925; // pre-computed (math.pi / 180)
  }
  public get currentAngle()
  {
    return this._yaw * 57.2957795; // pre-computed (180 / math.pi)
  }
  public set currentAngle(value: number)
  {
    this._yaw = value * 0.0174532925; // pre-computed (math.pi / 180)
  }
  public get pitch(){
    return this._pitch * 57.2957795; // pre-computed (180 / math.pi)
  }
  public set pitch(value: number){
    this._pitch = value * 0.01745329453 // pre-computed (math. pi / 180)
  }
  public get roll(){
    return this._roll * 57.2957795; // pre-computed (180 / math.pi)
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

  public constructor(caster: unit, target?: unit){
    this.caster = caster;
    this.casterX = GetUnitX(caster);
    this.casterY = GetUnitY(caster);
    this.casterOwner = GetOwningPlayer(caster);
    this.casterZ = GetUnitFlyHeight(caster);
    if (target != null){
      this.target = target;
      this.targetX = GetUnitX(target);
      this.targetY = GetUnitY(target);
      this.targetOwner = GetOwningPlayer(target);
      this.casterZ = GetUnitFlyHeight(target);
    }
  }

  /**
   * Will be called by system!, DO NOT CALL IT BY YOURSELF
   * @abstract
   */
  public abstract launch(): void;

  /**
   * Will be called by system!, DO NOT CALL IT BY YOURSELF
   * @abstract
   */
  public abstract action(): void;

  protected exitWorldBounds()
	{
		if (this._effect != null)
		{
			this.missileX = BlzGetLocalSpecialEffectX(this._effect);
			this.missileY = BlzGetLocalSpecialEffectY(this._effect);
			this.missileZ = BlzGetLocalSpecialEffectZ(this._effect);
		}
		if (this.interval > 0)
		{
			this.runInterval();
		}
		if (this._collisionRadius > 0)
		{
			this.runCollisions();
		}
		this.active = false;
		this.onImpact();
	}

  protected runInterval(){
    this.intervalLeft -= PERIOD;
		if (this.intervalLeft <= 0)
		{
			this.intervalLeft += this.interval;
			this.onPeriodic();
		}
  }
}
