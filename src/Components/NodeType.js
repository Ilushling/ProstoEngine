import { Component } from '../Component.js';

export class NodeType extends Component {
    static FREE = 0;
    static WALL = 1;
    static START = 2;
    static END = 3;
    static EXPLORING = 4;
    static EXPLORED = 5;
    static PATH = 6;
    
    _id = NodeType.FREE;

    constructor(entityId) {
        super(entityId);
    }

    get id() {
        return this._id;
    }

    set id(id) {
        this._id = id;
        NodeType.componentManager.world.eventDispatcher.dispatchEvent('nodeTypeOnChange', this.entityId);
    }

    static isWalkable(nodeTypeId) {
        return [NodeType.FREE, NodeType.EXPLORING, NodeType.END].includes(nodeTypeId);
    }
}