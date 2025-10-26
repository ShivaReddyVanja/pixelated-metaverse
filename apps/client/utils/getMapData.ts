import village_map from '@/lib/assets/village_map.json';

export const getMapData = () => {

    const mapData = village_map;
    const mapWidth = mapData.width;
    const mapHeight = mapData.height;

    const objectsArray = mapData.layers.find(layer =>layer.name === 'top_layer')?.data;
    
    if(!mapWidth || !mapHeight || !objectsArray){
        console.error("Map data is not valid");
        return {
            mapWidth: 0,
            mapHeight: 0,
            objectsArray: []
        }
    }
    return {
        mapWidth,
        mapHeight,
        objectsArray
    }
}
