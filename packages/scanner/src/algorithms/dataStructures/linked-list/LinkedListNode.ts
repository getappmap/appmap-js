export default class LinkedListNode<T> {
  value: T;
  next: LinkedListNode<T> | null;

  constructor(value: T, next: null | LinkedListNode<T> = null) {
    this.value = value;
    this.next = next;
  }

  toString(callback: undefined | ((value: T) => string) = undefined): string {
    return callback ? callback(this.value) : `${this.value}`;
  }
}
