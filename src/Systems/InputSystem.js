import { System } from '../System.js';

export class InputSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager.getAllEntities();
        this.eventDispatcher = this.world.eventDispatcher;
    }

    init() {
    }

    execute() {
    }
}