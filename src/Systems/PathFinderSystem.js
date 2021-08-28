import { System } from '../System.js';
import { NodeType } from '../Components/NodeType.js';
import { Edges } from '../Components/Edges.js';
import { AStarPathFinder } from '../Components/AStarPathFinder.js';
import { Position } from '../Components/Position.js';
import { AVLTree } from '../Trees/AVLTree.js';
import { BinarySearchTree } from '../Trees/BinarySearchTree.js';

export class PathFinderSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager.getAllEntities();
        this.eventDispatcher = this.world.eventDispatcher;

        this.startNode = undefined;
        this.endNode = undefined;
        // this.exploringEntities = [];
        // this.exploringEntities = new Map();
        this.exploringEntities = new AVLTree(); // O(log n)

        this.defaults = {
            baseWeight: 1,
            searchTickSteps: 5,
            buildPathTickSteps: 5,
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
            this.isEnabled = false;

            this.searchTickSteps = this.world.entityManager.entitiesCount / 200;
            this.searchTickSteps = 1 + (this.searchTickSteps | this.searchTickSteps); // | - is faster than Math.floor analog
            this.buildPathTickSteps = 5;
            this.cellSize = cellSize;
            this.margin = margin;
        });

        // @TODO to other system
        this.eventDispatcher.addEventListener('UIClearWallsButtonOnClick', () => {
            this.clearWalls();
        });
    }

    initPathFinder() {
        this.totalExploreTime = 0;
        this.totalExploredEntitiesCount = 0;
        this.totalFindBestTime = 0;
        this.totalEdgesTime = 0;

        this.isFinded = false;
        this.findFull = false;
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
                // this.exploringEntities = [this.startNode];
                this.exploringEntities.clear();
                // this.exploringEntities.set(0, this.startNode);
                this.exploringEntities.insert(0, this.startNode);
            }
            if (nodeType.id == NodeType.END) {
                this.endNode = entity;
                this.endNodePosition = this.endNode.getComponent(Position);
            }

            if (nodeType.id == NodeType.EXPLORING || nodeType.id ==  NodeType.EXPLORED || nodeType.id == NodeType.PATH) {
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
        // if (!this.isFinded && Array.isArray(this.exploringEntities) && this.exploringEntities.length === 0) {
        //     this.clear();
        // }
        if (!this.isFinded && this.exploringEntities.size === 0) {
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

            if (nodeType.id == NodeType.WALL) {
                nodeType.id = NodeType.FREE;
            }
        });
    }

    execute() {
        if (!this.isEnabled) {
            return;
        }

        if (this.isFinded) {
            for (let i = this.buildPathTickSteps - 1; i--;) {
                if (!this.lastDiscoveredPathEntity) {
                    break;
                }
                this.lastDiscoveredPathEntity = this.buildPathTick(this.lastDiscoveredPathEntity);
            }
            
            if (!this.lastDiscoveredPathEntity) {
                this.isEnabled = false;
            }
            return;
        }

        // if (Array.isArray(this.exploringEntities) && this.exploringEntities.length) {
        const exploringEntitiesSize = this.exploringEntities.size;
        if (exploringEntitiesSize) {
            if (this.findFull) {
                // let totalExploreTime = performance.now();
                while (exploringEntitiesSize) {
                    this.isFinded = this.searchTick(this.endNodePosition);
                    if (this.isFinded) {
                        this.lastDiscoveredPathEntity = this.endNode;
                        break;
                    }
                }
                // this.totalExploreTime = performance.now() - totalExploreTime;
            } else {
                for (let i = this.searchTickSteps; i--;) {
                    // let totalExploreTime = performance.now();
                    this.isFinded = this.searchTick(this.endNodePosition);
                    // this.totalExploreTime += performance.now() - totalExploreTime;
                    if (this.isFinded) {
                        this.lastDiscoveredPathEntity = this.endNode;
                        break;
                    }
                }
            }
        } else {
            this.isEnabled = false;
        }

        if (this.isFinded) {
            console.log('totalExploredEntitiesCount', this.totalExploredEntitiesCount, 'in', this.totalExploreTime);
            console.log('totalFindBestTime in', this.totalFindBestTime);
            console.log('totalEdgesTime in', this.totalEdgesTime);
        }
    }

    searchTick(targetPosition) {
        let isFinded = false;

        // let totalFindBestTime = performance.now();
        const currentEntity = this.getBestExploringEntity();
        // this.totalFindBestTime += performance.now() - totalFindBestTime;

        if (!currentEntity || !currentEntity.hasComponent(NodeType) || !currentEntity.hasComponent(Edges) || !currentEntity.hasComponent(AStarPathFinder)) {
            return;
        }

        const currentNodeType = currentEntity.getComponent(NodeType);
        const currentEdgesComponent = currentEntity.getComponent(Edges);
        const currentAStarPathFinder = currentEntity.getComponent(AStarPathFinder);

        if (currentNodeType.id === NodeType.EXPLORED) {
            return;
        }

        // let edgesTime = performance.now();
        currentEdgesComponent.edges.forEach(edge => {
            const edgeEntity = edge.node;
            if (!edgeEntity.hasComponent(NodeType) || !edgeEntity.hasComponent(Edges) || !edgeEntity.hasComponent(AStarPathFinder) || !edgeEntity.hasComponent(Position)) {
                return;
            }

            const nodeType = edgeEntity.getComponent(NodeType);
            const aStarPathFinder = edgeEntity.getComponent(AStarPathFinder);
            const position = edgeEntity.getComponent(Position);

            if (nodeType.id !== NodeType.FREE && nodeType.id !== NodeType.EXPLORING && nodeType.id !== NodeType.END) {
                return;
            }

            const newCost = currentAStarPathFinder.cost + (this.baseWeight * edge.weight); // Distance between current node and the start (g)
            const newHeuristic = this.getDistance(position, targetPosition); // Heuristic - distance from the current node to the end node (h)
            const totalCost = newCost + newHeuristic; // Total cost of the node (f)

            if (!aStarPathFinder.cost || !aStarPathFinder.heuristic || totalCost < aStarPathFinder.totalCost) {
                if (nodeType.id === NodeType.END) {
                    isFinded = true;
                } else {
                    nodeType.id = NodeType.EXPLORING;
                }

                aStarPathFinder.cost = newCost;
                aStarPathFinder.heuristic = newHeuristic;
                aStarPathFinder.totalCost = totalCost;
                aStarPathFinder.previous = currentEntity;

                this.addExploringEntity(edgeEntity, totalCost);
            }
        });
        // edgesTime = performance.now() - edgesTime;
        // this.totalEdgesTime += edgesTime;

        this.totalExploredEntitiesCount++;

        if (currentNodeType.id === NodeType.END) {
            isFinded = true;
        } else if (currentNodeType.id !== NodeType.START) {
            currentNodeType.id = NodeType.EXPLORED;
        }

        return isFinded;
    }

    addExploringEntity(entity, totalCost) {
        // this.exploringEntities.push(entity);

        // const hasExploringEntity = this.exploringEntities.has(totalCost);
        // if (hasExploringEntity) {
        //     const exploringEntity = this.exploringEntities.get(totalCost);
        //     // totalCost duplicate
        //     if (Array.isArray(exploringEntity)) {
        //         // is array container
        //         exploringEntity.push(entity);
        //     } else {
        //         // is object
        //         this.exploringEntities.set(totalCost, [exploringEntity, entity]);
        //     }
        // } else {
        //     this.exploringEntities.set(totalCost, entity);
        // }

        this.exploringEntities.insert(totalCost, entity);
    }

    getBestExploringEntity() {
        // slow
        // this.exploringEntities.sort((aEntity, bEntity) => {
        //     const aEntityAStarPathFinder = aEntity.getComponent(AStarPathFinder);
        //     const bEntityAStarPathFinder = bEntity.getComponent(AStarPathFinder);

        //     return bEntityAStarPathFinder.totalCost - aEntityAStarPathFinder.totalCost;
        // });
        // const currentEntity = this.exploringEntities.pop();
        // return currentEntity

        // let arrayContainerKey;
        // let bestTotalCost;
        // this.exploringEntities.forEach((exploringEntity, exploringEntityKey) => {
        //     if (Array.isArray(exploringEntity)) {
        //         if (!exploringEntity.length) {
        //             return this.exploringEntities.delete(exploringEntityKey);
        //         }
        //         // is array container
        //         return exploringEntity.forEach((exploringEntityOne, exploringEntityOneKey) => {
        //             const exploringEntityTotalCost = exploringEntityOne.getComponent(AStarPathFinder).totalCost;
        //             if (bestTotalCost == null || exploringEntityTotalCost < bestTotalCost) {
        //                 bestTotalCost = exploringEntityKey;
        //                 arrayContainerKey = exploringEntityOneKey;
        //             }
        //         });
        //     }

        //     // is object
        //     if (bestTotalCost == null || exploringEntityKey < bestTotalCost) {
        //         bestTotalCost = exploringEntityKey;
        //         arrayContainerKey = null;
        //     }
        // });

        // let currentEntity;
        // if (arrayContainerKey == null) {
        //     currentEntity = this.exploringEntities.get(bestTotalCost);
        //     this.exploringEntities.delete(bestTotalCost);
        // } else {
        //     const currentEntityContainer = this.exploringEntities.get(bestTotalCost);
        //     currentEntity = currentEntityContainer[arrayContainerKey];
        //     currentEntityContainer.splice(arrayContainerKey, 1);
        // }

        const min = this.exploringEntities.removeMin();
        if (min) {
            return min.value;
        }
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