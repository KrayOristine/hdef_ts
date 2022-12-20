import { MapPlayer } from "w3ts";
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

export function encode(stack: number[], player: MapPlayer, charList: string, listLength: number): string {
	let buffer = "",
		ichar = "012345689";
	stack.forEach((v) => {
		buffer += v + "-";
	});
	buffer += verify(player.name, buffer);
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

export function decode(code: string, player: MapPlayer, charList: string, listLength: number) {
	let buffer = "",
		ichar = "0123456789-";
	let arr: number[] = [];
	for (let i = 0; i <= 100; i++) arr[i] = 0;
	let m = 0,
		k: number = 0;
	for (let chr of code) {
		for (let j = 0; j < m; j++) arr[j] *= listLength;
		let i = listLength;
		for (i; i > 0; i--) {
			if (chr == charList.substring(i, i)) break;
		}
		arr[0] += i;
		for (let j = 0; j < m; j++) {
			k = arr[j] / 0xf4240;
			arr[j] -= k * 0xf4240;
			arr[j + 1] += k;
		}
		if (k > 0) m++;
	}
	while (m > 0) {
		for (let j = m; j > 0; j--) {
			k = arr[j] / 0xb;
			arr[j - 1] += (arr[j] - k * 0xb) * 0xf4240;
			arr[j] = k;
		}
		k = arr[0] / 0xb;
		let i = arr[0] - k * 0xb;
		buffer = ichar.substring(i, i) + buffer;
		arr[0] = k;
		if (arr[m] == 0) m--;
	}
	let i = 0,
		f = 0,
		n = 0,
		result: number[] = [];
	while (i < buffer.length) {
		for (i; i < buffer.length; i++) {
			if (i > 0 && buffer.substring(i, i) == "-" && buffer.substring(i - 1, i - 1) != "-") break;
		}
		if (i < buffer.length) k = i;
		n++;
		result[n] = S2I(buffer.substring(f, i));
		f++;
		i++;
	}
	f = verify(player.name, buffer.substring(0, k));
	if (f == result[n]) return result;
}
