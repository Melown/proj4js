import {D2R, R2D, PJD_3PARAM, PJD_7PARAM} from './constants/values';
import datum_transform from './datum_transform';
import {geodeticToGeocentric, geocentricToGeodetic} from './datumUtils';
import adjust_axis from './adjust_axis';
import proj from './Proj';
import toPoint from './common/toPoint';
function checkNotWGS(source, dest) {
  return ((source.datum.datum_type === PJD_3PARAM || source.datum.datum_type === PJD_7PARAM) && dest.datumCode !== 'WGS84') || ((dest.datum.datum_type === PJD_3PARAM || dest.datum.datum_type === PJD_7PARAM) && source.datumCode !== 'WGS84');
}

export default function transform(source, dest, point) {
  var wgs84;
  if (Array.isArray(point)) {
    point = toPoint(point);
  }

  // Workaround for datum shifts towgs84, if either source or destination projection is not wgs84
  if (source.datum && dest.datum && checkNotWGS(source, dest)) {
    wgs84 = new proj('WGS84');
    point = transform(source, wgs84, point);
    source = wgs84;
  }
  // DGR, 2010/11/12
  if (source.axis !== 'enu') {
    point = adjust_axis(source, false, point);
  }
  // Transform source points to long/lat, if they aren't already.
  if (source.projName === 'longlat') {
    point.x *= D2R;
    point.y *= D2R;
  }
  else {
    if (source.isGeocent) {
      if (source.to_meter) {
        point.x *= source.to_meter;
        point.y *= source.to_meter;
        point.z *= source.to_meter;
      }
      // originally dest.datum.geocentric_to_geodetic_noniter(point);
      point = geocentricToGeodetic(point, dest.es, dest.a, dest.b);
    } else {
      if (source.to_meter) {
        point.x *= source.to_meter;
        point.y *= source.to_meter;
      }
      point = source.inverse(point); // Convert Cartesian to longlat
    }
  }
// Adjust for the prime meridian if necessary
  if (source.from_greenwich) {
    point.x += source.from_greenwich;
  }

// Convert datums if needed, and if possible.
  point = datum_transform(source.datum, dest.datum, point);

// Adjust for the prime meridian if necessary
  if (dest.from_greenwich) {
    point.x -= dest.from_greenwich;
  }

  if (dest.projName === 'longlat') {
    // convert radians to decimal degrees
    point.x *= R2D;
    point.y *= R2D;
  } else { // else project
    if (dest.isGeocent) {
      point = geodeticToGeocentric(point, dest.es, dest.a);
      if (dest.to_meter) {
        point.x /= dest.to_meter;
        point.y /= dest.to_meter;
        point.z /= dest.to_meter;
      }
    } else {
      dest.forward(point);
      if (dest.to_meter) {
        point.x /= dest.to_meter;
        point.y /= dest.to_meter;
      }
    }
  }

// DGR, 2010/11/12
  if (dest.axis !== 'enu') {
    return adjust_axis(dest, true, point);
  }

  return point;
}
