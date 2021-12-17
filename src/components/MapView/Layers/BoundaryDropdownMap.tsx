import React from 'react';
import { useSelector } from 'react-redux';
import { createStyles, WithStyles, withStyles, Theme } from '@material-ui/core';
import { Feature } from 'geojson';

import { multiPolygon, MultiPolygon, Polygon } from '@turf/helpers';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import union from '@turf/union';
import { SimpleBoundaryDropdown } from './BoundaryDropdown';
import { BoundaryLayerProps } from '../../../config/types';
import {
  mapSelector,
  layerDataSelector,
} from '../../../context/mapStateSlice/selectors';
import { getBoundaryLayerSingleton } from '../../../config/utils';
import { LayerData } from '../../../context/layers/layer-data';
import { Extent } from './raster-utils';

const BoundaryDropdownMap = ({ classes }: BoundaryDropdownMapProps) => {
  const map = useSelector(mapSelector);

  const boundaryLayer = getBoundaryLayerSingleton();

  const boundaryLayerData = useSelector(layerDataSelector(boundaryLayer.id)) as
    | LayerData<BoundaryLayerProps>
    | undefined;
  const { data } = boundaryLayerData || {};

  if (!data || !map) {
    return null;
  }

  return (
    <SimpleBoundaryDropdown
      selectedBoundaries={[]}
      setSelectedBoundaries={newSelectedBoundaries => {
        const geometries = data.features
          .filter(f =>
            newSelectedBoundaries.includes(
              f.properties && f.properties[boundaryLayer.adminCode],
            ),
          )
          .filter(f => f.geometry.type === 'MultiPolygon')
          .map(f => f.geometry as MultiPolygon);

        const bboxes = geometries.map(geom => {
          const turfObj = multiPolygon(geom.coordinates);
          const geomBbox = bbox(turfObj);

          return geomBbox;
        });

        const bboxPolygons = bboxes.map(box => bboxPolygon(box));
        const unionBbox = bboxPolygons.reduce((unionPolygon, polygon) => {
          const unionObj = union(unionPolygon, polygon);
          if (!unionObj) {
            return unionPolygon;
          }
          return unionObj as Feature<Polygon>;
        }, bboxPolygons[0]);

        map.fitBounds(bbox(unionBbox) as Extent, {
          padding: 30,
        });
      }}
      className={classes.selectMenu}
    />
  );
};

const styles = (theme: Theme) =>
  createStyles({
    selectMenu: {
      backgroundColor: theme.palette.primary.main,
      minWidth: '100%',
      maxWidth: '200px',
      marginTop: '1em',
      padding: '0.5em',
    },
  });

export interface BoundaryDropdownMapProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(BoundaryDropdownMap);
