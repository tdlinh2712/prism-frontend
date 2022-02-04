import React, { useEffect } from 'react';
import { GeoJSONLayer } from 'react-mapbox-gl';
import { get } from 'lodash';
import * as MapboxGL from 'mapbox-gl';
import { useDispatch, useSelector } from 'react-redux';
import { legendToStops } from '../layer-utils';
import { PointDataLayerProps } from '../../../../config/types';

import { addPopupData } from '../../../../context/tooltipStateSlice';
import {
  LayerData,
  loadLayerData,
} from '../../../../context/layers/layer-data';
import { layerDataSelector } from '../../../../context/mapStateSlice/selectors';
import { useDefaultDate } from '../../../../utils/useDefaultDate';
import { getFeatureInfoPropsData } from '../../utils';
import {
  loadEWS1294Dataset,
  PointDatasetParams,
} from '../../../../context/layers/point_data';

// Point Data, takes any GeoJSON of points and shows it.
function PointDataLayer({ layer }: { layer: PointDataLayerProps }) {
  const selectedDate = useDefaultDate(layer.id);

  const layerData = useSelector(layerDataSelector(layer.id, selectedDate)) as
    | LayerData<PointDataLayerProps>
    | undefined;
  const dispatch = useDispatch();

  const { data } = layerData || {};

  useEffect(() => {
    if (!data) {
      dispatch(loadLayerData({ layer, date: selectedDate }));
    }
  }, [data, dispatch, layer, selectedDate]);

  if (!data) {
    return null;
  }

  const circleLayout: MapboxGL.CircleLayout = { visibility: 'visible' };
  const circlePaint: MapboxGL.CirclePaint = {
    'circle-opacity': layer.opacity || 0.3,
    'circle-color': {
      property: layer.measure,
      stops: legendToStops(layer.legend),
    },
  };

  const onHoverHandler = (evt: any) => {
    // by default add `measure` to the tooltip
    dispatch(
      addPopupData({
        [layer.title]: {
          data: get(evt.features[0], `properties.${layer.measure}`, 'No Data'),
          coordinates: evt.lngLat,
        },
      }),
    );

    // then add feature_info_props as extra fields to the tooltip
    dispatch(
      addPopupData(getFeatureInfoPropsData(layer.featureInfoProps || {}, evt)),
    );
  };

  const onClickHandler = (evt: any) => {
    // get the `external_id`
    const externalId = get(evt.features[0].properties, 'external_id');

    // form url
    const url = `http://sms.ews1294.info/api/v1/sensors/sensor_event?external_id=${externalId}`;
    // form a url for 7 days of the specified sensor
    // dispatch loadDataset with datasetparams
    // toggleSelected point/boundary
    const pointDatasetParams: PointDatasetParams = {
      url:
        'http://sms.ews1294.info/api/v1/sensors/sensor_event?external_id=TEPv4.0-013&start=2022-01-25&end=2022-01-31',
    };
    dispatch(loadEWS1294Dataset(pointDatasetParams));
  };

  return (
    <GeoJSONLayer
      id={`layer-${layer.id}`}
      data={data}
      circleLayout={circleLayout}
      circlePaint={circlePaint}
      circleOnMouseMove={onHoverHandler}
      circleOnClick={onClickHandler}
    />
  );
}

export default PointDataLayer;
