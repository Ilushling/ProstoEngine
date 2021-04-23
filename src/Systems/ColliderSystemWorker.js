addEventListener('message', event => {
    const data = event.data;
    const countInRow = data.countInRow;
    const start = data.start;
    const point = data.point;
    const isInterpolate = data.isInterpolate;
    const cellSize = data.cellSize + data.margin;
    const columns = data.columns;
    const isWorkerEntityUpdate = data.isWorkerEntityUpdate;
    if (isWorkerEntityUpdate) {
        globalThis.entitiesTypedArray = new Uint32Array(data.entitiesBuffer);
    }

    if (isInterpolate) {
        var interpolatedPointPositions = interpolatePointPositions(point, cellSize - (cellSize / 4));
    }
    
    const entitiesTypedArrayResult = [];

    // Point is intersect rect.y
    const entitiesTypedArray = optimizeEntitiesTypedArrayByY(globalThis.entitiesTypedArray, columns, point, cellSize, countInRow, start);
    const entitiesCount = entitiesTypedArray.length / columns;

    // Point X
    const startX = Math.min(point.previous.x, point.x);
    const endX = Math.max(point.previous.x, point.x);

    for (let i = entitiesCount; i >= 0; i--) {
        const entityOffset = i * columns;
        const entityId = entitiesTypedArray[entityOffset];
        const rect = {
            x: entitiesTypedArray[entityOffset + 1],
            y: entitiesTypedArray[entityOffset + 2],
            widthX: entitiesTypedArray[entityOffset + 3],
            heightY: entitiesTypedArray[entityOffset + 4],
        };

        // Point is intersect rect.x
        if (xIsIntersectRectX(startX, endX, rect)) {
            const isCollide = collides(rect, point, isInterpolate, interpolatedPointPositions);
            if (isCollide) {
                entitiesTypedArrayResult.push(entityId);
            }
        }
    }

    const entitiesBufferResult = new Uint32Array(entitiesTypedArrayResult).buffer;
    return postMessage(entitiesBufferResult, [entitiesBufferResult]);
});

function interpolatePointPositions(point, accuracyDivider) {
    if (point.x < 0 || point.y < 0) {
        return [];
    }

    const distance = {
        x: Math.abs(point.previous.x - point.x),
        y: Math.abs(point.previous.y - point.y)
    };

    const interpolateSteps = ~~((distance.x + distance.y) / accuracyDivider); // ~~ is faster analog Math.floor
    const interpolatedPointPositions = new Array(interpolateSteps);
    
    for (let i = interpolateSteps; i--;) {
        const step = i / interpolateSteps;
        interpolatedPointPositions[i] = {
            x: lerp(point.previous.x, point.x, step),
            y: lerp(point.previous.y, point.y, step)
        };
    }

    return interpolatedPointPositions;
}

function lerp(start, end, weight) {
    return start * (1 - weight) + end * weight;
}

function collides(rect, point, isInterpolate = false, interpolatedPointPositions = []) {
    let isCollide = rectContains(rect, point);
    if (isCollide) {
        return isCollide;
    }

    if (!isInterpolate) {
        return false;
    }

    for (let i = interpolatedPointPositions.length; i--;) {
        const interpolatedPointPosition = interpolatedPointPositions[i];
        isCollide = rectContains(rect, interpolatedPointPosition);

        if (isCollide) {
            return isCollide;
        }
    }

    return false;
}

function rectContains(rect, point) {
    return (point.x >= rect.x && point.x <= rect.widthX) && 
           (point.y >= rect.y && point.y <= rect.heightY);
}

/**
 * @todo refactor offsets
 */
function optimizeEntitiesTypedArrayByY(entitiesTypedArrayFull, columns, point, cellSize, countInRow, start) {
    if (!entitiesTypedArrayFull || !entitiesTypedArrayFull.length) {
        return [];
    }

    const cellsCountInFirstRow = getCellsCountInRow(entitiesTypedArrayFull, columns, true);
    const cellsCountInLastRow = getCellsCountInRow(entitiesTypedArrayFull, columns, false);

    const entitiesCount = entitiesTypedArrayFull.length / columns;
    const workerOffset = start;
    const startOffset = (countInRow != cellsCountInFirstRow) ? (((entitiesCount > countInRow) ? countInRow : entitiesCount) - cellsCountInFirstRow) * columns : 0;
    const endOffset = (countInRow != cellsCountInLastRow) ? (((entitiesCount > countInRow) ? countInRow : entitiesCount) - cellsCountInLastRow) * columns : 0;

    // Entity
    const firstY = entitiesTypedArrayFull[2];
    const lastY = entitiesTypedArrayFull[entitiesTypedArrayFull.length - columns /* one entity */ + 2 /* Y (third position) */];
    const firstYRow = ~~(firstY / cellSize);
    const lastYRow = ~~(lastY / cellSize);

    // Point
    const startY = Math.min(point.previous.y, point.y);
    const endY = Math.max(point.previous.y, point.y);

    const startYRow = ~~(startY / cellSize);
    const endYRow = ~~(endY / cellSize) + 1;

    const isStartOnFirstRow = (startYRow == firstYRow);
    const isEndOnLastRow = (endYRow - 1 == lastYRow);

    //console.log(entitiesCount, countInRow, ((entitiesCount < countInRow) ? cellsCountInFirstRow * columns : 0));
    const startIndex = Math.max(countInRow * startYRow * columns - workerOffset + (isStartOnFirstRow ? startOffset : 0), 0); // @TODO
    const endIndex = countInRow * endYRow * columns - workerOffset - (isEndOnLastRow ? endOffset : 0);

    // console.log({ 
    //     entitiesCount,
    //     startYRow,
    //     endYRow,
    //     isStartOnFirstRow,
    //     isEndOnLastRow,
    //     startIndex, 
    //     endIndex, 
    //     workerOffset, 
    //     startOffset,
    //     endOffset,
    //     cellsCountInFirstRow, 
    //     cellsCountInLastRow 
    // });

    if (endIndex < 0) {
        return [];
    }

    return entitiesTypedArrayFull.slice(startIndex, endIndex);
}

function getCellsCountInRow(entitiesTypedArrayFull, columns, isFirstRow) {
    let countInRow = -1;

    let i = isFirstRow 
        ? 1 /* X (second position) */ 
        : entitiesTypedArrayFull.length - columns /* one entity */ + 1 /* X (second position) */;

    let x = entitiesTypedArrayFull[i], previousX = x;
    while (isFirstRow ? x >= previousX : x <= previousX) {
        previousX = x;
        x = entitiesTypedArrayFull[i];
        countInRow++;
        i = isFirstRow ? i + columns : i - columns;
    }

    return countInRow;
}

function xIsIntersectRectX(startX, endX, rect) {
    return ((startX >= rect.x && startX <= rect.widthX) || (endX >= rect.x && endX <= rect.widthX)) || 
        ((rect.x >= startX && rect.x <= endX) || (rect.widthX >= startX && rect.widthX <= endX));
}