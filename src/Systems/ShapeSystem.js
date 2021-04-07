import { System } from '../System.js';
import { Shape } from '../Components/Shape.js';
import { NodeType } from '../Components/NodeType.js';
import { Hover } from '../Components/Hover.js';

export class ShapeSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this._entities = this.world.entityManager.getAllEntities();
    }

    init() {
    }

    execute() {
        for (let i = this._entities.length; i--;) { // Backward is faster
            const entity = this.world.entityManager.getEntityById(i);
            if (!entity.hasComponent(Shape) || !entity.hasComponent(NodeType) || !entity.hasComponent(Hover)) {
                continue;
            }

            const nodeType = entity.getComponent(NodeType);
            const shape = entity.getComponent(Shape);
            const hover = entity.getComponent(Hover);

            shape.previous.color = shape.color;

            if (hover.isPointerHover) {
                shape.color = '#d3d3d3';
                continue;
            }

            switch (nodeType.id) {
                case NodeType.FREE:
                    shape.color = '#ffffff';
                    break;
                case NodeType.WALL:
                    shape.color = '#464646';
                    break;
                case NodeType.START:
                    shape.color = '#00ff00';
                    break;
                case NodeType.END:
                    shape.color = '#ff0000';
                    break;
                case NodeType.EXPLORING:
                    shape.color = '#faf064';
                    break;
                case NodeType.EXPLORED:
                    shape.color = '#a0e6ff';
                    break;
                case NodeType.PATH:
                    shape.color = '#28b4fa';
                    break;
                default:
                    shape.color = '#ffffff';
                    break;
            }
        }
    }
}