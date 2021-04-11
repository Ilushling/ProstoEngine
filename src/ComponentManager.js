export class ComponentManager {
    constructor(world) {
        this.world = world;

        this.Components = [];
        this.componentsCount = [];
        this.newComponentId = 0;
    }

    registerComponent(Component) {
        if (Component._typeId != undefined) {
            console.log('Component already registered', Component);
            return;
        }

        Component._typeId = this.newComponentId++;
        Component.componentManager = this;
        this.Components[Component._typeId] = Component;
        this.componentsCount[Component._typeId] = 0;
    }

    hasComponent(Component) {
        return this.Components.includes(Component);
    }

    onEntityAddComponent(Component) {
        this.componentsCount[Component._typeId]++;
    }

    onEntityRemoveComponent(Component) {
        this.componentsCount[Component._typeId]--;
    }

    stats() {
        return;
    }
}