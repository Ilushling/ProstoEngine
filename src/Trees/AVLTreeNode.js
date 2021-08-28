import { BinarySearchTreeNode } from './BinarySearchTreeNode.js';

export class AVLTreeNode extends BinarySearchTreeNode {
    constructor(...args) {
        super(...args);
        this.height = 0;
}