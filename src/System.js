export class System {
    constructor(world) {
        this.world = world;
        this.enabled = true;
        this.initialized = false;

        this.executeTime = 0;
    }

    canExecute() {
        return this.initialized && this.enabled;
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