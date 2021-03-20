import { System } from '../System.js';
import { Shape } from '../Components/Shape.js';
import { NodeType } from '../Components/NodeType.js';
import { Hover } from '../Components/Hover.js';

export class ShapeSystem extends System {
    constructor(world) {
        super();
        this.world = world;
        this.entities = this.world.entityManager._entities;
    }

    init() {
    }

    execute() {
        this.entities.forEach(entity => {
            if (!entity.hasComponent(Shape) || !entity.hasComponent(NodeType) || !entity.hasComponent(Hover)) {
                return;
            }

            const nodeType = entity.getComponent(NodeType);
            const shape = entity.getComponent(Shape);
            const hover = entity.getComponent(Hover);

            if (hover.isMouseHover) {
                return shape.color = 'lightgray';
            }

            switch (nodeType.id) {
                case NodeType.FREE:
                    shape.color = 'rgb(255, 255, 255)';
                    break;
                case NodeType.WALL:
                    shape.color = 'rgb(70, 70, 70)';
                    break;
                case NodeType.START:
                    shape.color = 'rgb(0, 255, 0)';
                    break;
                case NodeType.END:
                    shape.color = 'rgb(255, 0, 0)';
                    break;
                case NodeType.EXPLORING:
                    shape.color = 'rgb(250, 240, 100)';
                    break;
                case NodeType.EXPLORED:
                    shape.color = 'rgb(160, 230, 255)';
                    break;
                case NodeType.PATH:
                    shape.color = 'rgb(40, 180, 250)';
                    break;
                default:
                    shape.color = 'rgb(255, 255, 255)';
                    break;
            }
        });
    }
}