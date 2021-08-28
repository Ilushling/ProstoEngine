import { LinkedListNode } from './LinkedListNode.js';

export class LinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.count = 0;
    }

    prepend(value) {
        const newNode = new LinkedListNode(value, this.head);
        
        this.count++;

        this.head = newNode;

        if (this.tail == null) {
            this.tail = newNode;
        }
    }

    append(value) {
        const newNode = new LinkedListNode(value);

        this.count++;

        if (this.head == null || this.tail == null) {
            this.head = newNode;
            this.tail = newNode;

            return;
        }

        this.tail.next = newNode;

        this.tail = newNode;
    }

    find(value) {
        if (this.head == null) {
            return null;
        }

        let currentNode = this.head;

        while (currentNode) {
            if (currentNode.value === value) {
                return currentNode;
            }

            currentNode = currentNode.next;
        }

        return null;
    }

    deleteTail() {
        if (this.tail == null) {
            return null;
        }

        this.count--;

        const deletedTail = this.tail;

        if (this.count == 1) {
            this.head = null;
            this.tail = null;

            return deletedTail;
        }

        let currentNode = this.head;
        while (currentNode.next) {
            if (currentNode.next.next == null) {
                currentNode.next = null;
            } else {
                currentNode = currentNode.next;
            }
        }

        this.tail = currentNode;

        return deletedTail;
    }

    deleteHead() {
        if (this.head == null) {
            return null;
        }

        this.count--;

        const deletedHead = this.head;

        if (this.head.next) {
            this.head = this.head.next;
        } else {
            this.head = null;
            this.tail = null;
        }

        return deletedHead;
    }

    clear() {
        this.head = null;
        this.count = 0;
    }
}