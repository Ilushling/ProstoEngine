import { Canvas } from './Components/Canvas.js';

export class InputManager {
    constructor(world) {
        this.world = world;
        // @TODO
        this.canvasEntity = this.world.createEntity('Canvas').addComponent(Canvas);
        this.canvasComponent = this.canvasEntity.getComponent(Canvas);
        this.canvas = this.canvasComponent.canvas;

        this.mouse = {
            x: 0,
            y: 0,
            leftButton: {
                up: false,
                down: false
            },
            previous: {
                x: 0,
                y: 0,
                leftButton: {
                    up: false,
                    down: false
                }
            }
        };

        this.mouseTemp = JSON.parse(JSON.stringify(this.mouse));

        this.isMouseInterpolate = true;

        this.canvas.onmouseup = event => this.onMouseUp(event);
        this.canvas.onmousedown = event => this.onMouseDown(event);
        this.canvas.onmousemove = event => this.onMouseMove(event);
    }

    onMouseUp(event) {
        this.mouseTemp.leftButton.up = true;
        this.mouseTemp.leftButton.pressed = false;
    }

    onMouseDown(event) {
        this.mouseTemp.leftButton.down = true;
        this.mouseTemp.leftButton.pressed = true;
    }

    onMouseMove(event) {
        const mousePosition = this.getMousePosition(event);
        this.mouseTemp.x = mousePosition.x;
        this.mouseTemp.y = mousePosition.y;
    }

    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    update() {
        // Save previous
        this.mouse.previous.x = this.mouse.x;
        this.mouse.previous.y = this.mouse.y;
        this.mouse.previous.leftButton.up      = this.mouse.leftButton.up;
        this.mouse.previous.leftButton.down    = this.mouse.leftButton.down;
        this.mouse.previous.leftButton.pressed = this.mouse.leftButton.pressed;

        // Update
        this.mouse.x = this.mouseTemp.x;
        this.mouse.y = this.mouseTemp.y;
        this.mouse.leftButton.up      = this.mouseTemp.leftButton.up;
        this.mouse.leftButton.down    = this.mouseTemp.leftButton.down;
        this.mouse.leftButton.pressed = this.mouseTemp.leftButton.pressed;

        // Clear
        this.mouseTemp.leftButton.up   = false;
        this.mouseTemp.leftButton.down = false;
    }
}