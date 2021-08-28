import { LinkedList } from '../Lists/LinkedList.js';

export class BinarySearchTreeNode {
    constructor(key = null, value = null, left = null, right = null, parent = null, count = 0, siblings = new LinkedList()) {
        this.key = key;
        this.value = value;
        this.left = left;
        this.right = right;
        this.parent = parent;

        // For duplicates key
        this.count = count;
        // LinkedList of values
        this.siblings = siblings;
    }
}