import { Component } from '../Component.js';

export class AStarPathFinder extends Component {
    constructor() {
        super();
        this.cost = 0;
        this.heuristic = 0;
        this.previous = undefined;
    }
}