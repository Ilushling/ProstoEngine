addEventListener('message', event => {
    const data = event.data;
    const entities = data.entities;
    const point = data.point;
    const isInterpolate = data.isInterpolate;
    
    for (let i = 0, length = entities.length; i < length; i++) {
        const entity = entities[i];
        const rect = entity.rect;

        entity.isCollide = isRectContainsPoint(rect, point);
        if (entity.isCollide) {
            continue;
        }

        if (!isInterpolate) {
            break;
        }
        
        const distance = {
            x: Math.abs(point.previous.x - point.x),
            y: Math.abs(point.previous.y - point.y)
        };

        const direction = {
            x: point.x - point.previous.x,
            y: point.y - point.previous.y
        };

        // Normalize vector
        const invLen = (1 / Math.sqrt(direction.x ** 2 + direction.y ** 2));
        direction.normalized = {
            x: direction.x * invLen,
            y: direction.y * invLen
        }

        const interpolateSteps = (distance.x + distance.y) * 2;

        // Interpolate
        const stepX = direction.normalized.x * distance.x / interpolateSteps;
        const stepY = direction.normalized.y * distance.y / interpolateSteps;
        
        for (let interpolateI = 1; interpolateI <= interpolateSteps; interpolateI++) {
            entity.isCollide = isRectContainsPoint(rect, { x: point.previous.x + stepX * interpolateI, y: point.previous.y + stepY * interpolateI });

            if (entity.isCollide) {
                break;
            }
        }
    }

    return postMessage(entities);
});

function isRectContainsPoint(rect, point) {
    return rect.x <= point.x && point.x <= rect.x + rect.width && rect.y <= point.y && point.y <= rect.y + rect.height;
}