export class ComponentManager {
    constructor() {
        this.Components = [];
        this.componentsCount = [];
        this.newComponentId = 0;
    }

    registerComponent(Component) {
        Component._typeId = this.newComponentId++;
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