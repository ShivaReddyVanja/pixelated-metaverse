import city_map from '@/public/citymap.json';

export const getMapData = () => {
    const mapData = city_map;
    const mapWidth = mapData.width;
    const mapHeight = mapData.height;

   const blockedTileIndices = mapData.layers?.find(layer => layer.name === 'objects')?.data?.reduce((arr: number[], val: number, idx: number) => {
  if (val > 0) arr.push(idx);
  return arr;
}, []);


    if(!mapWidth || !mapHeight || !blockedTileIndices){
        console.error("Map data is not valid");
        return {
            mapWidth: 0,
            mapHeight: 0,
            blockedTileIndices: []
        };
    }

    return {
        mapWidth,
        mapHeight,
        blockedTileIndices
    };
};
