export class SystemManager {
    constructor(world) {
        this.world = world;
        this._systems = [];
        this._executeSystems = [];
        this.systemsCount = 0;
    }

    registerSystem(System) {
        const system = new System(this.world);

        this._systems.push(system);
        if (typeof system.execute == 'function') {
            this._executeSystems.push(system);
        }
        this.systemsCount++;

        return this;
    }

    unregisterSystem(System) {
        const system = this.getSystem(System);
        if (system == null) {
            return this;
        }
    
        this._systems.splice(this._systems.indexOf(system), 1);
    
        system.unregister();

        this.systemsCount--;

        return this;
    }

    hasSystem(System) {
        return this._systems.includes(System);
    }

    getSystem(System) {
        return this._systems.find(system => system instanceof System);
    }

    getSystems() {
        return this._systems;
    }

    removeSystem(System) {
        if (!this.hasSystem(System)) {
            return;
        }
    
        this._systems.splice(index, 1);
    }

    async initSystems() {
        for (let i = 0, len = this._systems.length; i < len; i++) {
            await this.initSystem(this._systems[i]);
        }
    }

    async initSystem(system) {
        const startTime = Date.now();
        if (typeof system.init == 'function') {
            await system.init();
        }
        system.executeTime = Date.now() - startTime;

        system.initialized = true;
    }

    async executeSystem(system, deltaTime) {
        if (system.canExecute()) {
            const startTime = Date.now();
            await system.execute(deltaTime);
            system.executeTime = Date.now() - startTime;
        }
    }

    async afterExecuteSystem(system, deltaTime) {
        if (system.canExecute() && typeof system.afterExecute === 'function') {
            const startTime = Date.now();
            await system.afterExecute(deltaTime);
            system.executeTime = Date.now() - startTime;
        }
    }

    async execute(deltaTime) {
        for (let i = 0, len = this._executeSystems.length; i < len; i++) {
            await this.executeSystem(this._executeSystems[i], deltaTime);
        }
        for (let i = 0, len = this._executeSystems.length; i < len; i++) {
            await this.afterExecuteSystem(this._executeSystems[i], deltaTime);
        }
    }

    stats() {
        return;
    }
}