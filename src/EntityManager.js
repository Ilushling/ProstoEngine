import { Entity } from './Entity.js';
import { EventDispatcher } from './EventDispatcher.js';

export class EntityManager {
    constructor(world) {
        this.world = world;
        this.componentManager = world.componentManager;
        this.eventDispatcher = new EventDispatcher();

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

        entity.name = name;
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
        for (let i = this._entities.length; i--;) { // Backward is faster
            this.removeEntity(this.getEntityById(i));
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
        for (let i = entity._ComponentsTypes.length; i--;) { // Backward is faster
            const Component = entity._ComponentsTypes[i];
            this.entityRemoveComponent(entity, Component);
        }
    }

    getEntityById(id) {
        return this._entities[id];
    }

    getEntityByName(name) {
        return this._entitiesByName[name];
    }

    getAllEntities() {
        return this._entities;
    }

    stats() {
        return;
    }
}