export class SystemManager {
    constructor(world) {
        this.world = world;
        this._systems = [];
        this._executeSystems = [];
        this.systemsCount = 0;
    }

    registerSystem(System) {
        const system = new System(this.world);

        if (typeof system.init == 'function') {
            system.init();
        } else {
            console.log(2);
        }

        this._systems.push(system);
        if (typeof system.execute == 'function') {
            this._executeSystems.push(system);
        }

        return this;
    }

    unregisterSystem(System) {
        const system = this.getSystem(System);
        if (system == undefined) {
            return this;
        }
    
        this._systems.splice(this._systems.indexOf(system), 1);
    
        system.unregister();

        return this;
    }

    getSystem(System) {
        return this._systems.find(system => system instanceof System);
    }

    getSystems() {
        return this._systems;
    }

    removeSystem(System) {
        const index = this._systems.indexOf(System);
        if (!~index) {
            return;
        }
    
        this._systems.splice(index, 1);
    }

    executeSystem(system, deltaTime) {
        if (system.initialized && system.enabled) {
            if (system.canExecute()) {
                const startTime = new Date();
                system.execute(deltaTime);
                system.executeTime = new Date() - startTime;
            }
        }
    }

    execute(deltaTime) {
        this._executeSystems.forEach(system => this.executeSystem(system, deltaTime));
    }
}