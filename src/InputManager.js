export class InputManager {
    constructor(world) {
        this.world = world;
        this.context = document;

        this.pointer = {
            x: -1,
            y: -1,
            leftButton: {
                up: false,
                down: false,
                pressed: false
            },
            previous: {
                x: -1,
                y: -1,
                leftButton: {
                    up: false,
                    down: false,
                    pressed: false
                }
            }
        };

        this.pointerTemp = JSON.parse(JSON.stringify(this.pointer));

        this.isPointerInterpolate = true;

        // On mobile devices "onpointer..." events don't work correct.
        // Example: fast vertical move, handles only one first event "onpointermove" and "onpointerdown" don't work at this case
        this.context.onpointerup   = event => this.onPointerUp(event);
        this.context.onpointerdown = event => this.onPointerDown(event);
        this.context.onpointermove = event => this.onPointerMove(event);

        this.context.ontouchend   = event => this.onPointerUp(event);
        this.context.ontouchstart = event => this.onPointerDown(event);
        this.context.ontouchmove  = event => this.onPointerMove(event);
    }

    onPointerUp(event) {
        this.pointerTemp.leftButton.up = true;
        this.pointerTemp.leftButton.pressed = false;
    }

    onPointerDown(event) {
        event.preventDefault();
        this.pointerTemp.leftButton.down = true;
        this.pointerTemp.leftButton.pressed = true;

        if (event.pointerType == 'touch' || event.touches) {
            this.pointer.previous.x = -1;
            this.pointer.previous.y = -1;
            this.onPointerMove(event);
        }
    }

    onPointerMove(event) {
        event.preventDefault();

        //console.log(event);
        const pointerPosition = this.getPointerPosition(event);
        //console.log(pointerPosition);
        this.pointerTemp.x = pointerPosition.x;
        this.pointerTemp.y = pointerPosition.y;
    }

    getPointerPosition(event) {
        return { x: event.clientX ?? event.touches[0].clientX, y: event.clientY ?? event.touches[0].clientY };
    }

    update() {
        // Save previous
        this.pointer.previous.x = this.pointer.previous.x == -1 ? this.pointerTemp.x : this.pointer.x;
        this.pointer.previous.y = this.pointer.previous.y == -1 ? this.pointerTemp.y : this.pointer.y;
        this.pointer.previous.leftButton.up      = this.pointer.leftButton.up;
        this.pointer.previous.leftButton.down    = this.pointer.leftButton.down;
        this.pointer.previous.leftButton.pressed = this.pointer.leftButton.pressed;

        // Update
        this.pointer.x = this.pointerTemp.x;
        this.pointer.y = this.pointerTemp.y;
        this.pointer.leftButton.up      = this.pointerTemp.leftButton.up;
        this.pointer.leftButton.down    = this.pointerTemp.leftButton.down;
        this.pointer.leftButton.pressed = this.pointerTemp.leftButton.pressed;

        // Clear
        this.pointerTemp.leftButton.up   = false;
        this.pointerTemp.leftButton.down = false;
    }
}