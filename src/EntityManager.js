import { Entity } from './Entity.js';

export class EntityManager {
    constructor(world) {
        this.world = world;
        this.componentManager = world.componentManager;

        this._entities = [];
        this._entitiesByName = [];

        this.newEntityId = 0;
        this.entitiesCount = 0;
    }

    createEntity(name = '') {
        const entity = new Entity(this);
        if (this._entitiesByName[name]) {
            throw new Error(`Entity name ${name} already exists`);
        }

        this._entitiesByName[name] = entity;
        this._entities.push(entity);

        this.entitiesCount++;

        return entity;
    }

    removeEntity(entity) {
        this.entityRemoveAllComponents(entity);

        const entityIndex = this._entities.indexOf(entity);
        this._entities.splice(entityIndex, 1);
        if (this._entitiesByName[entity.name]) {
            delete this._entitiesByName[entity.name];
        }

        this.entitiesCount--;
    }

    removeAllEntities() {
        for (let i = 0, length = this._entities.length; i < length; i++) {
            this.removeEntity(this._entities[i]);
        }
    }

    entityAddComponent(entity, Component, data) {
        if (Component._typeId == undefined) {
            throw new Error('Component not registered');
        }
        entity._ComponentsTypes.push(Component);
        entity._components[Component._typeId] = new Component(data);
        this.componentManager.onEntityAddComponent(Component);
    }

    entityRemoveComponent(entity, Component) {
        delete entity._components[Component._typeId];

        const index = entity._ComponentsTypes.indexOf(Component);
        entity._ComponentsTypes.slice(index, 1);

        this.componentManager.onEntityRemoveComponent(Component);
    }

    entityRemoveAllComponents(entity) {
        entity._ComponentsTypes.forEach(Component => {
            this.entityRemoveComponent(entity, Component);
        });
    }

    getEntityById(id) {
        return this._entities[id];
    }

    getEntityByName(name) {
        return this._entitiesByName[name];
    }
}