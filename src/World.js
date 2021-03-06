import { SystemManager } from './SystemManager.js';
import { EntityManager } from './EntityManager.js';
import { ComponentManager } from './ComponentManager.js';
import { InputManager } from './InputManager.js';
import { EventDispatcher } from './EventDispatcher.js';

export class World {
    constructor(engine) {
        this.engine = engine;

        this.eventDispatcher = new EventDispatcher();
        this.componentManager = new ComponentManager(this);
        this.entityManager = new EntityManager(this);
        this.systemManager = new SystemManager(this);
        this.inputManager = new InputManager(this);

        this.start();
    }

    init() {
    }

    createEntity(name) {
        return this.entityManager.createEntity(name);
    }

    registerComponent(Component) {
        this.componentManager.registerComponent(Component);
        return this;
    }

    hasRegisteredComponent(Component) {
        return this.componentManager.hasComponent(Component);
    }

    registerSystem(System) {
        this.systemManager.registerSystem(System);
        return this;
    }

    unregisterSystem(System) {
        this.systemManager.unregisterSystem(System);
        return this;
    }

    getSystem(System) {
        return this.systemManager.getSystem(System);
    }
  
    getSystems() {
        return this.systemManager.getSystems();
    }

    async execute(deltaTime) {
        if (this.enabled) {
            this.inputManager.update();
            await this.systemManager.execute(deltaTime);
        }
    }

    start() {
        this.enabled = true;
    }

    stop() {
        this.enabled = false;
    }

    stats() {
        return {
            entities: this.entityManager.stats(),
            systems: this.systemManager.stats(),
        }
    }
}