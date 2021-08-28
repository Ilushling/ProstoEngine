import { DoublyLinkedListNode } from './DoublyLinkedListNode.js';

export class DoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.count = 0;
    }

    prepend(value) {
        const newNode = new DoublyLinkedListNode(value, this.head);
        
        this.count++;

        if (this.head) {
            this.head.previous = newNode;
        }

        this.head = newNode;

        if (this.tail == null) {
            this.tail = newNode;
        }
    }

    append(value) {
        const newNode = new DoublyLinkedListNode(value, this.head);

        this.count++;

        if (this.tail) {
            this.tail.next = newNode;
        }

        newNode.previous = this.tail;

        this.tail = newNode;

        if (this.head == null) {
            this.head = newNode;
        }
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

        if (this.tail.previous) {
            this.tail = this.tail.previous;
            this.tail.next = null;
        } else {
            this.head = null;
            this.tail = null;
        }

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
            this.head.previous = null;
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