export class ComponentManager {
    constructor(world) {
        this.world = world;
        this.eventDispatcher = this.world.eventDispatcher;

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

    onEntityAddComponent(entity, Component) {
        this.eventDispatcher.dispatchEvent('onEntityAddComponent', entity.id);
        this.componentsCount[Component._typeId]++;
    }

    onEntityRemoveComponent(entity, Component) {
        this.eventDispatcher.dispatchEvent('onEntityRemoveComponent', entity.id);
        this.componentsCount[Component._typeId]--;
    }

    stats() {
        return;
    }
}