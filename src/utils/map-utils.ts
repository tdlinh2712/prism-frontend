import { Map as MapBoxMap } from 'mapbox-gl';
import { LayerKey, BoundaryLayerProps, LayerType } from '../config/types';
import { getBoundaryLayers } from '../config/utils';
import { addLayer, removeLayer } from '../context/mapStateSlice';

const LAYER_NAME_PREFIX = 'layer-';

/**
 * Checks weither given layer is on view
 * @param map the MapBox Map object
 * @param layerId the LayerKey
 */
export function isLayerOnView(map: MapBoxMap | undefined, layerId: LayerKey) {
  return map
    ?.getStyle()
    .layers?.map(l => l.source)
    .includes(`${LAYER_NAME_PREFIX}${layerId}`);
}

export function safeDispatchAddLayer(
  _map: MapBoxMap | undefined,
  layer: LayerType,
  dispatcher: Function,
) {
  if (!isLayerOnView(_map, layer.id)) {
    dispatcher(addLayer(layer));
  }
}

export function safeDispatchRemoveLayer(
  _map: MapBoxMap | undefined,
  layer: LayerType,
  dispatcher: Function,
) {
  if (isLayerOnView(_map, layer.id)) {
    dispatcher(removeLayer(layer));
  }
}

/**
 * Get all boundaries already on the map
 * @param map the MapBox Map object
 */
export function boundariesOnView(
  map: MapBoxMap | undefined,
): BoundaryLayerProps[] {
  const boundaries = getBoundaryLayers();
  const onViewLayerKeys = map
    ?.getStyle()
    .layers?.map(l => l.source)
    .filter(s => s && s.toString().includes(LAYER_NAME_PREFIX))
    .map(k => k && k.toString().split(LAYER_NAME_PREFIX)[1]);
  return boundaries.filter(
    b => onViewLayerKeys && onViewLayerKeys.includes(b.id),
  );
}

export function onlyBoundaryLayerUnderCursor(
  map: MapBoxMap | undefined,
  point: [number, number],
) {
  const boundaryIds = getBoundaryLayers().map(l => l.id.toString());
  const features = map?.queryRenderedFeatures(point);
  const nonBoundaryLayerFeatures = features
    ?.filter(feat => feat.source.includes(LAYER_NAME_PREFIX))
    .filter(f => {
      const id = f.source.split(LAYER_NAME_PREFIX)[1];
      return !boundaryIds.includes(id);
    });
  return nonBoundaryLayerFeatures?.length === 0;
}
