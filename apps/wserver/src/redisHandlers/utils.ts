
export const getFreePositions = (objectPositions: string[], width: number, height: number): string[] => {
    const freePositions: string[] = [];
    for (let y = 1; y <= height; y++) {
        for (let x = 1; x <= width; x++) {
            const pos = `${x},${y}`;
            if (!objectPositions.includes(pos)) {
                freePositions.push(pos);
            }
        }
    }
    return freePositions;
}

export const getObjectsFilledPositions = (objects: number[], width: number) => {
    const occupiedByObjects: string[] = []
    objects.forEach((i) => {
        let x = ((i - 1) % width) + 1
        let y = Math.ceil(i / width);
        let posKey = `${x},${y}`;
        occupiedByObjects.push(posKey);
    })
    return occupiedByObjects;
}