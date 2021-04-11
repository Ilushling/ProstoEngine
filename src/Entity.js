export class Entity {
    constructor(entityManager) {
        this._entityManager = entityManager;

        this.id = entityManager.newEntityId;

        this._components = [];
        this._ComponentsTypes = [];
    }

    addComponent(Component, data) {
        this._entityManager.entityAddComponent(this, Component, data);
        return this;
    }

    hasComponent(Component) {
        return this._ComponentsTypes.includes(Component);
    }

    getComponent(Component) {
        return this._components[Component._typeId];
    }

    getComponents() {
        return this._components;
    }

    removeComponent(Component) {
        this._entityManager.entityRemoveComponent(this, Component);
        return this;
    }
}