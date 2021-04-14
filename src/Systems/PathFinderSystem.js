import { System } from '../System.js';
import { NodeType } from '../Components/NodeType.js';
import { Edges } from '../Components/Edges.js';
import { AStarPathFinder } from '../Components/AStarPathFinder.js';
import { Position } from '../Components/Position.js';

export class PathFinderSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager.getAllEntities();
        this.eventDispatcher = this.world.eventDispatcher;

        this.startNode = undefined;
        this.endNode = undefined;
        this.exploringEntities = [];

        this.defaults = {
            baseWeight: 1,
            searchTickSteps: 5,
            buildPathTickSteps: 2
        };

        this.isEnabled = false;
    }

    init() {
        this.initListeners();
        this.initPathFinder();
    }

    initListeners() {
        this.eventDispatcher.addEventListener('startStopPathFinder', () => {
            this.startStop();
        });
        this.eventDispatcher.addEventListener('UIStartButtonOnClick', () => {
            this.startStop();
        });
        this.eventDispatcher.addEventListener('clearPathFinder', () => {
            this.clear();
        });
        this.eventDispatcher.addEventListener('UIClearPathFinderButtonOnClick', () => {
            this.clear();
        });
        this.eventDispatcher.addEventListener('UIWeightOnChange', baseWeight => {
            this.baseWeight = +baseWeight;
        });
        this.eventDispatcher.addEventListener('onGridGenerate', ({ cellSize, margin }) => {
            this.searchTickSteps = this.world.entityManager.entitiesCount / 400;
            this.searchTickSteps = 1 + (this.searchTickSteps | this.searchTickSteps); // | - is fater than Math.floor analog
            this.buildPathTickSteps = 2;
            this.cellSize = cellSize;
            this.margin = margin;
        });

        // @TODO to other system
        this.eventDispatcher.addEventListener('UIClearWallsButtonOnClick', () => {
            this.clearWalls();
        });
    }

    initPathFinder() {
        this.isFinded = false;
        this.lastDiscoveredPathEntity = undefined;
        this.searchTickSteps = this.searchTickSteps || this.defaults.searchTickSteps;
        this.buildPathTickSteps = this.buildPathTickSteps || this.defaults.buildPathTickSteps;
        this.baseWeight = this.baseWeight ?? this.defaults.baseWeight;

        this._entities.forEach(entity => {
            if (!entity.hasComponent(NodeType) || !entity.hasComponent(Edges) || !entity.hasComponent(AStarPathFinder)) {
                return;
            }

            const nodeType = entity.getComponent(NodeType);
            if (nodeType.id == NodeType.START) {
                this.startNode = entity;
                this.exploringEntities = [this.startNode];
            }
            if (nodeType.id == NodeType.END) {
                this.endNode = entity;
                this.endNodePosition = this.endNode.getComponent(Position);
            }

            if ([NodeType.EXPLORING, NodeType.EXPLORED, NodeType.PATH].includes(nodeType.id)) {
                nodeType.id = NodeType.FREE;
                const aStarPathFinder = entity.getComponent(AStarPathFinder);
                aStarPathFinder.clear();
            }
        });
    }

    clear() {
        this.initPathFinder();
    }

    startStop() {
        this.isEnabled = !this.isEnabled;
        if (!this.isFinded && Array.isArray(this.exploringEntities) && this.exploringEntities.length == 0) {
            this.clear();
        }
    }

    // @TODO to other system
    clearWalls() {
        this._entities.forEach(entity => {
            if (!entity.hasComponent(NodeType)) {
                return;
            }

            const nodeType = entity.getComponent(NodeType);

            if ([NodeType.WALL].includes(nodeType.id)) {
                nodeType.id = NodeType.FREE;
            }
        });
    }

    execute() {
        if (!this.isEnabled) {
            return;
        }

        if (this.isFinded) {
            for (let i = 0; i < this.buildPathTickSteps; i++) {
                if (!this.lastDiscoveredPathEntity) {
                    break;
                }
                this.lastDiscoveredPathEntity = this.buildPathTick(this.lastDiscoveredPathEntity);
            }
            return;
        }

        if (Array.isArray(this.exploringEntities) && this.exploringEntities.length) {
            for (let i = 0; i < this.searchTickSteps; i++) {
                if (this.isFinded) {
                    break;
                }

                this.isFinded = this.searchTick(this.endNodePosition);
                if (this.isFinded) {
                    this.lastDiscoveredPathEntity = this.endNode;
                }
            }
        }
    }

    searchTick(targetPosition) {
        let isFinded = false;

        this.exploringEntities.sort((aEntity, bEntity) => {
            if (!aEntity.hasComponent(AStarPathFinder) || !bEntity.hasComponent(AStarPathFinder)) {
                return;
            }

            const aEntityAStarPathFinder = aEntity.getComponent(AStarPathFinder);
            const bEntityAStarPathFinder = bEntity.getComponent(AStarPathFinder);

            return bEntityAStarPathFinder.totalCost - aEntityAStarPathFinder.totalCost;
        });

        const currentEntity = this.exploringEntities.pop();
        if (!currentEntity || !currentEntity.hasComponent(NodeType) || !currentEntity.hasComponent(Edges) || !currentEntity.hasComponent(AStarPathFinder)) {
            return;
        }

        const currentNodeType = currentEntity.getComponent(NodeType);
        const currentEdgesComponent = currentEntity.getComponent(Edges);
        const currentAStarPathFinder = currentEntity.getComponent(AStarPathFinder);

        if ([NodeType.EXPLORED].includes(currentNodeType.id)) {
            return;
        }

        currentEdgesComponent.edges.forEach(edge => {
            const edgeEntity = edge.node;
            if (!edgeEntity.hasComponent(NodeType) || !edgeEntity.hasComponent(Edges) || !edgeEntity.hasComponent(AStarPathFinder) || !edgeEntity.hasComponent(Position)) {
                return;
            }

            const nodeType = edgeEntity.getComponent(NodeType);
            const aStarPathFinder = edgeEntity.getComponent(AStarPathFinder);
            const position = edgeEntity.getComponent(Position);

            if (![NodeType.FREE, NodeType.EXPLORING, NodeType.END].includes(nodeType.id)) {
                return;
            }

            const newCost = currentAStarPathFinder.cost + (this.baseWeight * edge.weight); // Distance between current node and the start (g)
            const newHeuristic = this.getDistance(position, targetPosition); // Heuristic - distance from the current node to the end node (h)
            const totalCost = newCost + newHeuristic; // Total cost of the node (f)

            if (!aStarPathFinder.cost || !aStarPathFinder.heuristic || totalCost < aStarPathFinder.totalCost) {
                if (nodeType.id == NodeType.END) {
                    isFinded = true;
                } else {
                    nodeType.id = NodeType.EXPLORING;
                }

                aStarPathFinder.cost = newCost;
                aStarPathFinder.heuristic = newHeuristic;
                aStarPathFinder.totalCost = totalCost;
                aStarPathFinder.previous = currentEntity;
                this.exploringEntities.push(edgeEntity);
            }
        });

        if (currentNodeType.id == NodeType.END) {
            isFinded = true;
        } else if (currentNodeType.id != NodeType.START) {
            currentNodeType.id = NodeType.EXPLORED;
        }

        return isFinded;
    }

    /**
     * 
     * @todo name should be getManhattanDistance?
     * @todo test perfomance
     * @todo get margin of node
     * 
     * @param {object} startPosition 
     * @param {object} endPosition 
     * @returns {number} distanceByNodes
     */
    getDistance(startPosition, endPosition) {
        // Manhattan distance
        const pixelDistance = Math.sqrt((endPosition.x - startPosition.x) ** 2 + (endPosition.y - startPosition.y) ** 2);
        // ** .5 is analog Math.sqrt
        //const pixelDistance = ((endPosition.x - startPosition.x) ** 2 + (endPosition.y - startPosition.y) ** 2) ** .5;
        const distanceByNodes = pixelDistance / (this.cellSize + this.margin);
        // Distance from start to end + all margins between start to end
        return distanceByNodes;
    }

    buildPathTick(entity) {
        if (!entity.hasComponent(AStarPathFinder)) {
            return;
        }

        const aStarPathFinder = entity.getComponent(AStarPathFinder);
        if (aStarPathFinder.previous) {
            if (!aStarPathFinder.previous.hasComponent(NodeType)) {
                return;
            }

            const nodeType = aStarPathFinder.previous.getComponent(NodeType);
            if (nodeType.id == NodeType.START) {
                return;
            }
            nodeType.id = NodeType.PATH;

            return aStarPathFinder.previous;
        }
    }
}