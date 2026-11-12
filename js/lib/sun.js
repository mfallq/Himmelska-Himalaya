// Sunrise and sunset for a date and place, computed on the device.
// Standard sunrise equation; good to a minute or two for a flat horizon.
// In the mountains the sun reaches a valley floor later and leaves it earlier.

const RAD = Math.PI / 180;
export const NEPAL_UTC_OFFSET = 5.75; // Nepal time is UTC+5:45 all year

function julianDay(date) {
  let y = date.getFullYear(), m = date.getMonth() + 1;
  const d = date.getDate();
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - a + Math.floor(a / 4)) - 1524.5;
}

/**
 * @param {Date} date  local calendar day
 * @returns minutes after local midnight for dawn (civil), sunrise, sunset and
 *          dusk, plus day length in minutes; null where the sun does not cross.
 */
export function sunTimes(date, lat, lon, utcOffset = NEPAL_UTC_OFFSET) {
  const n = julianDay(date) - 2451545 + 0.0008 + 0.5;
  const jStar = n - lon / 360;
  const M = ((357.5291 + 0.98560028 * jStar) % 360 + 360) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const transit = 2451545 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const sinDec = Math.sin(lambda * RAD) * Math.sin(23.44 * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const hourAngle = (altitude) => {
    const c = (Math.sin(altitude * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec);
    return Math.abs(c) > 1 ? null : Math.acos(c) / RAD;
  };
  const toMinutes = (jd) => {
    const utcHours = ((jd + 0.5) % 1) * 24;
    return (((utcHours + utcOffset) * 60) % 1440 + 1440) % 1440;
  };
  const sun = hourAngle(-0.833), civil = hourAngle(-6);
  return {
    dawn: civil === null ? null : toMinutes(transit - civil / 360),
    sunrise: sun === null ? null : toMinutes(transit - sun / 360),
    sunset: sun === null ? null : toMinutes(transit + sun / 360),
    dusk: civil === null ? null : toMinutes(transit + civil / 360),
    dayLength: sun === null ? null : (sun / 360) * 2 * 1440,
  };
}

export const clock = (minutes) =>
  minutes === null ? '–' : `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.round(minutes % 60) % 60).padStart(2, '0')}`;
