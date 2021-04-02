addEventListener('message', event => {
    const data = event.data;
    const entitiesBuffer = new Uint16Array(data.entitiesBuffer);
    const point = data.point;
    const isInterpolate = data.isInterpolate;
    const columns = 5; // Columns from ColliderSystem

    if (isInterpolate) {
        var interpolatedPointPositions = interpolatePointPositions(point);
    }
    
    const entityResult = [];
    for (let i = 0, length = entitiesBuffer.byteLength / 2 / columns; i < length; i++) {
        const entityOffset = i * columns;
        const entityId = entitiesBuffer[entityOffset];
        const rect = {
            x: entitiesBuffer[entityOffset + 1],
            y: entitiesBuffer[entityOffset + 2],
            width: entitiesBuffer[entityOffset + 3],
            height: entitiesBuffer[entityOffset + 4],
        };
        entityResult.push(entityId);

        const isCollide = collides(rect, point, isInterpolate, interpolatedPointPositions);
        entityResult.push(isCollide);
    }

    const entitiesBufferResult = new Uint16Array(entityResult).buffer;
    return postMessage(entitiesBufferResult, [entitiesBufferResult]);
});

function interpolatePointPositions(point) {
    const interpolatedPointPositions = [];

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

    const interpolateSteps = (distance.x + distance.y) / 20;

    // Interpolate
    const stepX = direction.normalized.x * distance.x / interpolateSteps;
    const stepY = direction.normalized.y * distance.y / interpolateSteps;
    
    for (let i = 1; i <= interpolateSteps; i++) {
        // Collide detected by interpolation
        interpolatedPointPositions.push({ x: point.previous.x + stepX * i, y: point.previous.y + stepY * i });
    }

    return interpolatedPointPositions;
}

function collides(rect, point, isInterpolate = false, interpolatedPointPositions = []) {
    let isCollide = rectContains(rect, point);
    if (isCollide) {
        return isCollide;
    }

    if (!isInterpolate) {
        return false;
    }

    for (const interpolatedPointPosition of interpolatedPointPositions) {
        isCollide = rectContains(rect, interpolatedPointPosition);

        if (isCollide) {
            return isCollide;
        }
    }

    return false;
}

function rectContains(rect, point) {
    return rect.x  <= point.x && 
           point.x <= rect.x + rect.width && 
           rect.y  <= point.y && 
           point.y <= rect.y + rect.height;
}