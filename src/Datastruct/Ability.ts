import { Handle, Item, Unit } from "w3ts";

export class Ability extends Handle<ability> {
	public readonly handle!: ability;
	private _id: number;

	private constructor(ability: ability) {
		if (Handle.initFromHandle()) {
			super();
		} else {
			super(ability);
		}
	}

	public setField(
		field: abilitystringfield | abilityintegerfield | abilityrealfield | abilitybooleanfield,
		value: string | number | boolean
	) {
		const fieldType = field.toString().substr(0, field.toString().indexOf(":"));

		if (fieldType == "abilitystringfield" && typeof value == "string") {
			return BlzSetAbilityStringField(this.handle, field as abilitystringfield, value);
		} else if (fieldType == "abilityintegerfield" && typeof value == "number") {
			return BlzSetAbilityIntegerField(this.handle, field as abilityintegerfield, value);
		} else if (fieldType == "abilityrealfield" && typeof value == "number") {
			return BlzSetAbilityRealField(this.handle, field as abilityrealfield, value);
		} else if (fieldType == "abilitybooleanfield" && typeof value == "boolean") {
			return BlzSetAbilityBooleanField(this.handle, field as abilitybooleanfield, value);
		}
	}

	public getField(field: abilitystringfield | abilityintegerfield | abilityrealfield | abilitybooleanfield) {
		const fieldType = field.toString().substr(0, field.toString().indexOf(":"));

		switch (fieldType) {
			case "abilitystringfield":
				return BlzGetAbilityStringField(this.handle, field as abilitystringfield);
			case "abilityintegerfield":
				return BlzGetAbilityIntegerField(this.handle, field as abilityintegerfield);
			case "abilityrealfield":
				return BlzGetAbilityRealField(this.handle, field as abilityrealfield);
			case "abilitybooleanfield":
				return BlzGetAbilityBooleanField(this.handle, field as abilitybooleanfield);
		}
	}

	public setLevelField(
		levelField: abilitystringlevelfield | abilityintegerlevelfield | abilityreallevelfield | abilitybooleanlevelfield,
		value: string | number | boolean,
		level: number
	) {
		const fieldType = levelField.toString().substr(0, levelField.toString().indexOf(":"));

		if (fieldType == "abilitystringlevelfield" && typeof value == "string") {
			return BlzSetAbilityStringLevelField(this.handle, levelField as abilitystringlevelfield, level, value);
		} else if (fieldType == "abilityintegerlevelfield" && typeof value == "number") {
			return BlzSetAbilityIntegerLevelField(this.handle, levelField as abilityintegerlevelfield, level, value);
		} else if (fieldType == "abilityreallevelfield" && typeof value == "number") {
			return BlzSetAbilityRealLevelField(this.handle, levelField as abilityreallevelfield, level, value);
		} else if (fieldType == "abilitybooleanlevelfield" && typeof value == "boolean") {
			return BlzSetAbilityBooleanLevelField(this.handle, levelField as abilitybooleanlevelfield, level, value);
		}
	}

	public getLevelField(
		levelField: abilitystringlevelfield | abilityintegerlevelfield | abilityreallevelfield | abilitybooleanlevelfield,
		level: number
	) {
		const fieldType = levelField.toString().substr(0, levelField.toString().indexOf(":"));

		switch (fieldType) {
			case "abilitystringfield":
				return BlzGetAbilityStringLevelField(this.handle, levelField as abilitystringlevelfield, level);
			case "abilityintegerfield":
				return BlzGetAbilityIntegerLevelField(this.handle, levelField as abilityintegerlevelfield, level);
			case "abilityrealfield":
				return BlzGetAbilityRealLevelField(this.handle, levelField as abilityreallevelfield, level);
			case "abilitybooleanfield":
				return BlzGetAbilityBooleanLevelField(this.handle, levelField as abilitybooleanlevelfield, level);
		}
	}

	public get id(): number {
		return this._id;
	}

	private set id(value: number) {
		this._id = value;
	}

	public static fromEvent() {
		let h = this.fromHandle(GetSpellAbility());
		h._id = GetSpellAbilityId();
		return h;
	}

	public static fromItem(item: Item, id: number) {
		let h = this.fromHandle(BlzGetItemAbility(item.handle, id));
		h.id = id;
		return h;
	}

	public static fromItemIndex(item: Item, index: number) {
		return this.fromHandle(BlzGetItemAbilityByIndex(item.handle, index));
	}

	public static fromUnit(unit: Unit, id: number) {
		let h = this.fromHandle(BlzGetUnitAbility(unit.handle, id));
		h.id = id;
		return h;
	}

	public static fromUnitIndex(unit: Unit, index: number) {
		return this.fromHandle(BlzGetUnitAbilityByIndex(unit.handle, index));
	}

	public static fromHandle(handle: ability): Ability {
		return this.getObject(handle);
	}
}
