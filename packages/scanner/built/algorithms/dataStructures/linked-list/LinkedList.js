"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LinkedListNode_1 = __importDefault(require("./LinkedListNode"));
const Comparator_1 = __importDefault(require("../../utils/Comparator"));
class LinkedList {
    constructor(comparatorFunction) {
        this.head = null;
        this.tail = null;
        this.compare = new Comparator_1.default(comparatorFunction);
    }
    prepend(value) {
        // Make new node to be a head.
        this.head = new LinkedListNode_1.default(value, this.head);
        return this;
    }
    append(value) {
        const newNode = new LinkedListNode_1.default(value);
        // If there is no head yet let's make new node a head.
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
            return this;
        }
        // Attach new node to the end of linked list.
        this.tail.next = newNode;
        this.tail = newNode;
        return this;
    }
    delete(value) {
        if (!this.head) {
            return null;
        }
        let deletedNode = null;
        // If the head must be deleted then make 2nd node to be a head.
        while (this.head && this.compare.equal(this.head.value, value)) {
            deletedNode = this.head;
            this.head = this.head.next;
        }
        let currentNode = this.head;
        if (currentNode !== null) {
            // If next node must be deleted then make next node to be a next next one.
            while (currentNode.next) {
                if (this.compare.equal(currentNode.next.value, value)) {
                    deletedNode = currentNode.next;
                    currentNode.next = currentNode.next.next;
                }
                else {
                    currentNode = currentNode.next;
                }
            }
        }
        // Check if tail must be deleted.
        if (this.compare.equal(this.tail.value, value)) {
            this.tail = currentNode;
        }
        return deletedNode;
    }
    find(value = undefined, callback = undefined) {
        if (!this.head) {
            return null;
        }
        let currentNode = this.head;
        while (currentNode) {
            // If callback is specified then try to find node by callback.
            if (callback && callback(currentNode.value)) {
                return currentNode;
            }
            // If value is specified then try to compare by value..
            if (value !== undefined && this.compare.equal(currentNode.value, value)) {
                return currentNode;
            }
            currentNode = currentNode.next;
        }
        return null;
    }
    deleteTail() {
        if (this.head === this.tail) {
            const deletedTail = this.tail;
            this.head = null;
            this.tail = null;
            return deletedTail;
        }
        const deletedTail = this.tail;
        // Rewind to the last node and delete "next" link for the node before the last one.
        let currentNode = this.head;
        while (currentNode.next) {
            if (!currentNode.next.next) {
                currentNode.next = null;
            }
            else {
                currentNode = currentNode.next;
            }
        }
        this.tail = currentNode;
        return deletedTail;
    }
    deleteHead() {
        if (!this.head) {
            return null;
        }
        const deletedHead = this.head;
        if (this.head.next) {
            this.head = this.head.next;
        }
        else {
            this.head = null;
            this.tail = null;
        }
        return deletedHead;
    }
    toArray() {
        const nodes = [];
        let currentNode = this.head;
        while (currentNode) {
            nodes.push(currentNode);
            currentNode = currentNode.next;
        }
        return nodes;
    }
    toString(callback = undefined) {
        return this.toArray()
            .map((node) => node.toString(callback))
            .toString();
    }
}
exports.default = LinkedList;
