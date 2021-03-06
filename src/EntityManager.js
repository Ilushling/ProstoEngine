import { Entity } from './Entity.js';

export class EntityManager {
    constructor(world) {
        this.world = world;
        this.componentManager = this.world.componentManager;
        this.eventDispatcher = this.world.eventDispatcher;

        this._entities = new Map();
        this._entitiesByName = new Map();

        this.newEntityId = 0;
        this.entitiesCount = 0;
    }

    createEntity(name) {
        const entity = new Entity(this);

        if (name != null) {
            if (this._entitiesByName.has(name)) {
                throw new Error(`Entity name ${name} already exists`);
            }

            entity.name = name;
            this._entitiesByName.set(name, entity);
        }
        this._entities.set(this.newEntityId, entity);

        this.eventDispatcher.dispatchEvent('onCreateEntity', this.newEntityId);

        this.newEntityId++;
        this.entitiesCount++;

        return entity;
    }

    removeEntity(entity) {
        this.entityRemoveAllComponents(entity);

        this._entities.delete(entity.id);
        if (entity.hasOwnProperty('name') && this._entitiesByName.has(entity.name)) {
            this._entitiesByName.delete(entity.name);
        }

        this.eventDispatcher.dispatchEvent('onRemoveEntity', entity.id);

        this.entitiesCount--;
    }

    removeAllEntities() {
        this._entities.forEach(entity => {
            this.removeEntity(entity);
        });
    }

    entityAddComponent(entity, Component, data) {
        if (Component._typeId == null) {
            throw new Error('Component not registered');
        }
        entity._ComponentsTypes.push(Component);
        entity._components[Component._typeId] = new Component(entity.id);
        this.componentManager.onEntityAddComponent(entity, Component);
    }

    entityRemoveComponent(entity, Component) {
        delete entity._components[Component._typeId];

        const index = entity._ComponentsTypes.indexOf(Component);
        entity._ComponentsTypes.splice(index, 1);

        this.componentManager.onEntityRemoveComponent(entity, Component);
    }

    entityRemoveAllComponents(entity) {
        for (let i = entity._ComponentsTypes.length; i--;) { // Backward is faster
            const Component = entity._ComponentsTypes[i];
            this.entityRemoveComponent(entity, Component);
        }
    }

    getEntityById(id) {
        return this._entities.get(id);
    }

    getEntityByName(name) {
        return this._entitiesByName.get(name);
    }

    getAllEntities() {
        return this._entities;
    }

    stats() {
        return;
    }
}