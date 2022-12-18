export class LinkedList<T> {
	public head: LinkedList<T>;
	public next: LinkedList<T>;
	public prev: LinkedList<T>;
	public data: T;
	private n: number;

	constructor(h?: LinkedList<T>) {
		if (h) {
			this.head = h;
			this.next = h;
			this.prev = h;
			this.n = h.n;
		} else {
			this.head = this;
			this.next = this;
			this.prev = this;
			this.n = 0;
		}
	}

	insert(data: any, after?: boolean) {
		let node: LinkedList<T> = new LinkedList(this);
		node.data = data;
		let from = after ? this.next : this;
		from.prev.next = node;
		node.prev = from.prev;
		node.next = from;
		this.n = this.n + 1;
		return node;
	}

	remove() {
		if (this == this.head) return;
		this.prev.next = this.next;
		this.next.prev = this.prev;
		this.head.n = this.head.n - 1;
		return this; // Must set null or else it wont ever be collected
	}
}
