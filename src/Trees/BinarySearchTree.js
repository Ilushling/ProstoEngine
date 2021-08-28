import { BinarySearchTreeNode } from './BinarySearchTreeNode.js';

export class BinarySearchTree {
    constructor() {
        this.root = null;
        this.size = 0;
    }

    /**
     * @param {number} key 
     * @param {any} value 
     * @param {object} currentNode 
     * @returns {object} newNode
     */
    insert(key, value, currentNode = this.root) {
        const newNode = new BinarySearchTreeNode(key, value);
        this.size++;

        if (this.root == null) {
            /*
                (X)
            */
            this.root = newNode;
            return newNode;
        }

        let parentNode = null;
        // Without function recursive calls for better perfomance
        while (true) {
            currentNode.parent = parentNode;

            if (key < currentNode.key) {
                if (currentNode.left == null) {
                    /*
                           A
                          /
                        (X)
                    */
                    currentNode.left = newNode;
                    break;
                }

                parentNode = currentNode;
                currentNode = currentNode.left;
            } else if (key > currentNode.key) {
                if (currentNode.right == null) {
                    /*
                        A
                         \
                         (X)
                    */
                    currentNode.right = newNode;
                    break;
                }

                parentNode = currentNode;
                currentNode = currentNode.right;
            } else {
                // key === currentNode.key
                /*
                    3 ways to handle duplication key:
                    1) Ignore insert
                    2) (only for keys, without values) add counter to node of duplications
                    3) Add siblings to node by LinkedList
                */
                // Increment duplicate counter
                currentNode.count++;

                // 3 way - Add sibling duplicate
                /*
                    (X) - A
                */
                currentNode.siblings.append(newNode);
                break;
            }
        }
        newNode.parent = currentNode;

        return newNode;
    }

    /**
     * @param {object} currentNode
     * @returns {object} min
     */
    min(currentNode = this.root) {
        if (currentNode == null) {
            return null;
        }

        while (currentNode.left != null) {
            /*
                     A
                    /
                  ...
                  /
                (X)  
            */
            currentNode = currentNode.left;
        }

        return currentNode;
    }

    /**
     * @param {object} currentNode
     * @returns {object} min
     */
    removeMin(currentNode = this.root) {
        if (currentNode == null) {
            return null;
        }
        let parentNode = null;

        while (currentNode.left != null) {
            parentNode = currentNode;
            currentNode = currentNode.left;
        }

        return this.remove(currentNode.key, parentNode || this.root);
    }

    /**
     * @param {object} currentNode
     * @returns {object} max
     */
    max(currentNode = this.root) {
        if (currentNode == null) {
            return null;
        }

        while (currentNode.right != null) {
            /*
                A
                 \
                 ...
                   \
                   (X)  
            */
            currentNode = currentNode.right;
        }

        return currentNode;
    }

    /**
     * @param {object} currentNode
     * @returns {object} max
     */
    removeMax(currentNode = this.root) {
        if (currentNode == null) {
            return null;
        }
        let parentNode = null;

        while (currentNode.right != null) {
            parentNode = currentNode;
            currentNode = currentNode.right;
        }

        return this.remove(currentNode.key, parentNode || this.root);
    }

    /**
     * @param {number} key
     * @returns {boolean} contains
     */
    contains(key) {
        return !!this.find(key);
    }

    /**
     * @param {number} key
     * @param {object} currentNode
     * @returns {object} node
     */
    find(key, currentNode = this.root) {
        if (currentNode == null) {
            return null;
        }

        while (currentNode.key != key) {
            if (key < currentNode.key) {
                currentNode = currentNode.left;
            } else {
                currentNode = currentNode.right;
            }

            if (currentNode == null) {
                return null;
            }
        }

        return currentNode;
    }

    /**
     * @param {number} key
     * @param {object} currentNode
     * @returns {object} removedNode
     */
    remove(key, currentNode = this.root) {
        let parentNode = null;
        if (currentNode == null) {
            return null;
        }

        let removedNode = null;

        // Without function recursive calls for better perfomance
        while (true) {
            if (key < currentNode.key) {
                parentNode = currentNode;
                currentNode = currentNode.left;
            } else if (key > currentNode.key) {
                parentNode = currentNode;
                currentNode = currentNode.right;
            } else {
                // key === currentNode.key
                if (currentNode.count) {
                    // currentNode key have duplications
                    /*
                        (X) - A
                    */
                    // Decrement duplicate counter
                    currentNode.count--;
                    removedNode = currentNode.siblings.deleteHead().value;
                    break;
                }
                removedNode = currentNode;

                if (currentNode.left == null && currentNode.right == null) {
                    // No childrens - leaf
                    if (parentNode != null) {
                        /*
                                A
                              /   \
                            (X) or (X)
                        */
                        // Delete currentNode in parentNode
                        if (currentNode.key < parentNode.key) {
                            parentNode.left = null;
                        } else {
                            parentNode.right = null;
                        }
                    } else {
                        // key is root
                        /*
                            (X)
                        */
                        this.root = null;
                    }
                    break;
                }

                if (currentNode.left == null) {
                    // No left children
                    // Replace currentNode with right in parentNode
                    const right = currentNode.right;
                    if (parentNode != null) {
                        if (currentNode.key < parentNode.key) {
                            parentNode.left = right;
                        } else {
                            parentNode.right = right;
                        }
                    } else {
                        // currentNode === this.root && this.root.left == null
                        /*
                            (X)
                              ^
                               \
                                A
                        */
                        // Replace this.root with right
                        this.root = right;
                    }
                    // Update right parent
                    right.parent = parentNode;
                    break;
                }

                if (currentNode.right == null) {
                    // No right children
                    // Replace currentNode with left in parentNode
                    const left = currentNode.left;
                    if (parentNode != null) {
                        if (currentNode.key < parentNode.key) {
                            parentNode.left = left;
                        } else {
                            parentNode.right = left;
                        }
                    } else {
                        // currentNode === this.root && this.root.right == null
                        /*
                              (X)
                              ^
                             /
                            A
                        */
                        // Replace this.root with left
                        this.root = left;
                    }
                    // Update left parent
                    left.parent = parentNode;
                    break;
                }

                /* 2 childrens - Find heirNode for replace currentNode */
                let heirParentNode = currentNode;
                // 1 step - Get right
                /*
                    A
                     \
                     (X)
                */
                let heirNode = currentNode.right;
                // further steps - Get left
                while (heirNode.left != null) {
                    // Get left until lefts end
                    /*
                           A
                            \
                             B
                            /
                          ...
                          /
                        (X) 
                    */
                    heirParentNode = heirNode;
                    heirNode = heirNode.left;
                }

                // Replace currentNode with heirNode in parentNode
                if (parentNode != null) {
                    if (heirNode.key < parentNode.key) {
                        parentNode.left = heirNode;
                    } else {
                        parentNode.right = heirNode;
                    }
                } else {
                    this.root = heirNode;
                }
                // Update heirNode parent
                heirNode.parent = parentNode;

                // Move currentNode.left to heirNode.left
                heirNode.left = currentNode.left;
                // Update left parent
                heirNode.left.parent = heirNode;

                if (heirNode.right) {
                    // HeirNode has right - Replace heirNode with right in heirParentNode
                    /*
                        (X)
                          ^
                           \
                            A
                    */
                    const right = heirNode.right;
                    if (heirNode.key < heirParentNode.key) {
                        heirParentNode.left = right;
                    } else {
                        heirParentNode.right = right;
                    }
                } else {
                    // HeirNode has no children (leaf) - Delete heirNode in heirParentNode
                    heirParentNode.right = null;
                }
                break;
            }
        }

        this.size--;

        return removedNode;
    }

    clear() {
        this.root = null;
        this.size = 0;
    }
}