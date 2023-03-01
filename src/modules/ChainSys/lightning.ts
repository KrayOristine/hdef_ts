import { UnitGetZ } from "Utils";
import { Unit, Timer } from "w3ts";

export function attachLightning(source: Unit, target: Unit, modelPath: string) {
	let sz = UnitGetZ(source);
	let tz = UnitGetZ(target);
	let light = AddLightningEx(modelPath, true, source.x, source.x, sz, target.x, target.y, tz);
	let alpha = 1.0;
	let t = new Timer();
	t.start(0.04, true, () => {
		MoveLightningEx(light, true, source.x, source.y, sz, target.x, target.y, tz);
		alpha -= 0.04;
		if (alpha <= 0) {
			t.pause();
			t.destroy();
			DestroyLightning(light);
			return;
		}
		SetLightningColor(light, 1.0, 1.0, 1.0, alpha);
	});
}
