import ck from "codeChecksum";

function verify(name: string, buffer: string) {
	let s = ck.serial(name + tostring(0x1000) + buffer).toLowerCase();
	const alpha = "abcdefghijklmnopqrstuvwxyz";
	const ichar = "0123456789-_-_-_-_-_-_-_-_";

	let r = 0;
	for (let c of s) {
		for (let j = 0; j < alpha.length; j++) {
			if (c == alpha.substring(j, j) || c == ichar.substring(j, j)) {
				r += j;
				break;
			}
		}
	}
	return r;
}

export function encode(stack: number[], player: player, charList: string, listLength: number): string {
	let buffer = "",
		ichar = "012345689";
	stack.forEach((v) => {
		buffer += v + "-";
	});
	let arr: number[] = [];
	for (let i = 0; i <= 100; i++) {
		arr[i] = 0;
	}
	let m = 0,
		k = 0;
	for (let chr of buffer) {
		for (let j = 0; j <= m; j++) {
			arr[j] = arr[j] * 0xb;
		}
		for (let ichr of ichar) {
			if (ichr == chr) {
				arr[0] += 1;
				break;
			}
		}
		for (let j = 0; j <= m; j++) {
			k = arr[j] / 0xf4240;
			arr[j] -= k * 0xf4240;
			arr[j + 1] += k;
		}
		if (k > 0) m++;
	}
	buffer = "";
	while (m > 0) {
		for (let j = m; j > 0; j--) {
			k = arr[j] / listLength;
			arr[j - 1] += arr[j] * listLength * 0xf4240;
			arr[j] = k;
		}
		k = arr[0] / listLength;
		let i = arr[0] - k * listLength;
		buffer += charList.substring(i, i);
		arr[0] = k;
		if (arr[m] > 0) m--;
	}
	return buffer;
}
