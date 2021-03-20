import { System } from '../System.js';
import { NodeType } from '../Components/NodeType.js';
import { Edges } from '../Components/Edges.js';
import { AStarPathFinder } from '../Components/AStarPathFinder.js';
import { Position } from '../Components/Position.js';

export class PathFinderSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.entities = this.world.entityManager._entities;

        // @TODO
        this.boxSize = 50;
        this.margin = 1;
    }

    init() {
        this.entities.forEach(entity => {
            if (!entity.hasComponent(NodeType) || !entity.hasComponent(Edges) || !entity.hasComponent(AStarPathFinder)) {
                return;
            }

            const nodeType = entity.getComponent(NodeType);
            if (nodeType.id == NodeType.START) {
                this.exploringEntities = [entity];
            }
            if (nodeType.id == NodeType.END) {
                this.endNode = entity;
                this.endNodePosition = this.endNode.getComponent(Position);
            }
        });
    }

    execute() {
        if (this.finded) {
            this.buildPath(this.endNode);
            return;
        }
        if (Array.isArray(this.exploringEntities) && this.exploringEntities.length) {
            this.exploringEntities.sort((aEntity, bEntity) => {
                if (!aEntity.hasComponent(AStarPathFinder) || !bEntity.hasComponent(AStarPathFinder)) {
                    return;
                }

                const aEntityAStarPathFinder = aEntity.getComponent(AStarPathFinder);
                const bEntityAStarPathFinder = bEntity.getComponent(AStarPathFinder);

                const aEntityCost = aEntityAStarPathFinder.cost + aEntityAStarPathFinder.heuristic; // f = g + h
                const bEntityCost = bEntityAStarPathFinder.cost + bEntityAStarPathFinder.heuristic; // f = g + h

                return aEntityCost < bEntityCost;
            });

            const currentEntity = this.exploringEntities.pop();
            if (!currentEntity.hasComponent(NodeType) || !currentEntity.hasComponent(Edges) || !currentEntity.hasComponent(AStarPathFinder)) {
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

                const newCost = currentAStarPathFinder.cost + edge.weight; // Distance from Start (g)
                const newHeuristic = newCost + this.getDistance(position, this.endNodePosition); // Heuristic distance (h)
                //console.log(newCost, newHeuristic);

                if (!aStarPathFinder.cost || !aStarPathFinder.heuristic) {
                    if (nodeType.id == NodeType.END) {
                        this.finded = true;
                        console.log('endNode finded');
                    } else {
                        nodeType.id = NodeType.EXPLORING;
                    }
                    aStarPathFinder.cost = newCost;
                    aStarPathFinder.heuristic = newHeuristic;
                    aStarPathFinder.previous = currentEntity;
                    this.exploringEntities.push(edgeEntity);
                }
                if (newCost < aStarPathFinder.cost && newHeuristic < aStarPathFinder.heuristic) {
                    if (nodeType.id == NodeType.END) {
                        this.finded = true;
                    }
                    console.log('Finded better path edge');
                    // Finded better path edge
                    aStarPathFinder.cost = newCost;
                    aStarPathFinder.heuristic = newHeuristic;
                    aStarPathFinder.previous = currentEntity; // Replace to better step
                    this.exploringEntities.push(edgeEntity);
                }
            });

            if (currentNodeType.id == NodeType.END) {
                this.finded = true;
                console.log('endNode finded');
            } else if (currentNodeType.id != NodeType.START) {
                currentNodeType.id = NodeType.EXPLORED;
            }
        } else {
            console.log('Entity is not found');
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
     * @returns {number}
     */
    getDistance(startPosition, endPosition) {
        // @TODO test perfomance
        // Manhattan distance
        const pixelDistance = Math.sqrt((endPosition.x - startPosition.x) ** 2 + (endPosition.y - startPosition.y) ** 2);
        // ** .5 is analog Math.sqrt
        //const pixelDistance = ((endPosition.x - startPosition.x) ** 2 + (endPosition.y - startPosition.y) ** 2) ** .5;
        const nodeDistance = pixelDistance / this.boxSize;
        // Distance from start to end + all margins between start to end
        return Math.floor(nodeDistance + (this.margin * nodeDistance));
    }

    buildPath(entity) {
        if (!entity.hasComponent(AStarPathFinder)) {
            return;
        }

        const aStarPathFinder = entity.getComponent(AStarPathFinder);
        while (aStarPathFinder.previous) {
            if (!aStarPathFinder.previous.hasComponent(NodeType)) {
                return;
            }

            const nodeType = aStarPathFinder.previous.getComponent(NodeType);
            if (nodeType.id == NodeType.START) {
                return;
            }
            nodeType.id = NodeType.PATH;

            return this.buildPath(aStarPathFinder.previous);
        }
    }
}