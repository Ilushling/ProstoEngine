import { Component } from '../Component.js';

export class AStarPathFinder extends Component {
    constructor() {
        super();
        this.totalCost = 0; // Total cost of the node (f)
        this.cost = 0; // Distance between current node and the start (g)
        this.heuristic = 0; // Heuristic - distance from the current node to the end node (h)
        this.previous = undefined; // Came from
    }
}