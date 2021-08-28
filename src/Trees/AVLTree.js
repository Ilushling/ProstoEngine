import { BinarySearchTree } from './BinarySearchTree.js';

export class AVLTree extends BinarySearchTree {
    /**
     * Update node height, in case left subtree height and right subtree height is correct
     * 
     * @param {object} node
     */
    updateHeight(node) {
        // Update node height
        const leftNodeHeight = (node.left) ? node.left.height : 0;
        const rightNodeHeight = (node.right) ? node.right.height : 0;
        node.height = ((leftNodeHeight > rightNodeHeight) ? leftNodeHeight : rightNodeHeight) + 1; 
    }

    /**
     * Get node balance factor
     * 
     * @param {object} node
     * @returns {number} balanceFactor
     */
    bfactor(node) {
        const leftNodeHeight = (node.left) ? node.left.height : 0;
        const rightNodeHeight = (node.right) ? node.right.height : 0;
        return leftNodeHeight - rightNodeHeight;
    }

    /**
     * Balance node
     * 
     * @param {object} node
     * @returns {object} rootOfBalanced
     */
    balance(node) {
        this.updateHeight(node);

        if (this.bfactor(node) > 1) {
            // Left is bigger - Left Left (LL)
            if (this.bfactor(node.left) < 0) {
                // Right of Left is bigger - Left Right (LR)
                node = this.rotateLeft(node.left);
            }

            return this.rotateRight(node);
        }

        if (this.bfactor(node) < -1) {
            // Right is bigger - Right Right (RR)
            if (this.bfactor(node.right) > 0) {
                // Left of Right is bigger - Right Left (RL)
                node = this.rotateRight(node.right);
            }

            return this.rotateLeft(node);
        }

        return node;
    }

    /*
        Right Right (RR)
              Z                 Y     
             / \              /   \   
            T1  Y            Z     X  
               / \     ->   / \   / \ 
              T2  X        T1 T2 T3 T4
                 / \                  
                T3 T4                 
        Z - node moves to Y.left (T2)
        Y - right moves to root (Z)
        T2 - left of right (Y) moves to right (Y)
    */
    /**
     * @param {object} node
     * @returns {object} rootOfBalanced
     */
    rotateLeft(node /* Z */) {
        const right = node.right;     // Y
        const rightLeft = right.left; // T2

        node.right = right.left;      // Y (right) replace with T2 (rightLeft)
        right.left = node;            // T2 (rightLeft) replace with Z
        // Z replace with Y (right)
        let parentNode = node.parent;
        if (parentNode != null) {
            if (right.key < parentNode.key) {
                parentNode.left = right;
            } else {
                parentNode.right = right;
            }
        } else {
            this.root = right;
        }

        // Update parents
        node.parent = right; // Y is parent of Z
        right.parent = parentNode; // Z parent is parent of Y
        if (rightLeft != null) {
            rightLeft.parent = node; // Z is parent of T2
        }

        this.updateHeight(node);  // Z now is left
        this.updateHeight(right); // Y now is root

        return right;
    }

    /*
        Left Left (LL)
              Z               Y     
             / \            /   \   
            Y  T4          X     Z  
           / \     ->     / \   / \ 
          X   T3         T1 T2 T3 T4
         / \                        
        T1  T2                      
        Z - node moves to Y.right (T3)
        Y - right moves to root (Z)
        T3 - right of left (Y) moves to left (Y)
    */
    /**
     * @param {object} node
     * @returns {object} rootOfBalanced
     */
    rotateRight(node /* Z */) {
        const left = node.left;       // Y
        const leftRight = left.right; // T3

        node.left = left.right;       // Y (left) replace with T3 (leftRight)
        left.right = node;            // T3 (leftRight) replace with Z
        // Z replace with Y (left)
        let parentNode = node.parent;
        if (parentNode != null) {
            if (left.key < parentNode.key) {
                parentNode.left = left;
            } else {
                parentNode.right = left;
            }
        } else {
            this.root = left;
        }

        // Update parents
        node.parent = left; // Y is parent of Z
        left.parent = parentNode; // Z parent is parent of Y
        if (leftRight != null) {
            leftRight.parent = node; // Z is parent of T3
        }

        this.updateHeight(node); // Z now is right
        this.updateHeight(left); // Y now is root

        return left;
    }

    /**
     * @returns {object} newNode
     */
    insert(...args) {
        const newNode = super.insert(...args);

        let currentNode = newNode;
        currentNode.height = 1;
        currentNode = currentNode.parent;
        while (currentNode != null) {
            this.balance(currentNode);

            currentNode = currentNode.parent;
        }

        return newNode;
    }

    /**
     * @returns {object} removedNode
     */
    remove(...args) {
        const removedNode = super.remove(...args);

        let currentNode = removedNode.parent;
        while (currentNode != null) {
            this.balance(currentNode);

            currentNode = currentNode.parent;
        }

        return removedNode;
    }

    /**
     * @returns {object} minNode
     */
    removeMin(...args) {
        const min = super.removeMin(...args);
        return min;

        /*if (min == null) {
            return;
        }

        let currentNode = min.parent;
        while (currentNode != null) {
            this.balance(currentNode);

            currentNode = currentNode.parent;
        }

        return min;*/
    }

    /**
     * @returns {object} maxNode
     */
    removeMax(...args) {
        const max = super.removeMax(...args);
        return max;

        /*if (max == null) {
            return;
        }

        let currentNode = max.parent;
        while (currentNode != null) {
            this.balance(currentNode);

            currentNode = currentNode.parent;
        }

        return max;*/
    }
}