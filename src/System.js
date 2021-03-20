export class System {
    constructor(world) {
        this.world = world;
        this.enabled = true;
        this.initialized = true;

        this.executeTime = 0;
    }

    canExecute() {
        return true;
    }

    getName() {
        return this.constructor.getName();
    }
  
    start() {
        this.enabled = true;
    }

    stop() {
        this.executeTime = 0;
        this.enabled = false;
    }
}