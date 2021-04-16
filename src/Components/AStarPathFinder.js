import { Component } from '../Component.js';

export class AStarPathFinder extends Component {
    totalCost = 0; // Total cost of the node (f)
    cost = 0; // Distance between current node and the start (g)
    heuristic = 0; // Heuristic - distance from the current node to the end node (h)
    previous; // Came from

    constructor(entityId) {
        super(entityId);
    }

    clear() {
        this.totalCost = 0; // Total cost of the node (f)
        this.cost = 0; // Distance between current node and the start (g)
        this.heuristic = 0; // Heuristic - distance from the current node to the end node (h)
        this.previous = undefined; // Came from
    }
}