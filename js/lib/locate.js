// One position from the phone's GPS, on request. Nothing is stored or sent.
// It keeps listening until the fix is good enough (or time runs out) and then
// returns the best one, because the first fix is often 100 m or more off.

export class LocateError extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind; // 'unsupported' | 'denied' | 'unavailable' | 'timeout'
  }
}

/** Plain-language message for a failure, with the next step. */
export function locateMessage(err) {
  switch (err?.kind) {
    case 'denied':
      return 'Location is off for this site. In iPhone Settings, open Privacy & Security, then Location Services, find Safari Websites (or Annapurna) and choose While Using.';
    case 'unsupported':
      return 'This browser cannot give a position. Open the site in Safari or Chrome.';
    case 'unavailable':
      return 'No position available. Go outside, away from walls, and try again.';
    default:
      return 'No GPS fix yet. Go outside, away from walls, and try again.';
  }
}

/**
 * @param {{timeout?: number, good?: number, onUpdate?: (fix) => void}} options
 *   good: stop when the accuracy is this many metres or better.
 * @returns {Promise<{lat:number, lon:number, acc:number, alt:number|null, altAcc:number|null, ts:number}>}
 */
export function locate({ timeout = 60000, good = 25, onUpdate } = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new LocateError('unsupported'));
    let best = null, finished = false, watch = null, lastError = null;
    const timer = setTimeout(() => finish(new LocateError(lastError || 'timeout')), timeout);
    function finish(err) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (watch !== null) navigator.geolocation.clearWatch(watch);
      if (best) resolve(best);
      else reject(err || new LocateError('timeout'));
    }
    watch = navigator.geolocation.watchPosition(
      (p) => {
        const c = p.coords;
        const fix = { lat: c.latitude, lon: c.longitude, acc: c.accuracy, alt: c.altitude, altAcc: c.altitudeAccuracy, ts: p.timestamp };
        if (!best || fix.acc < best.acc) best = fix;
        onUpdate?.(best);
        if (best.acc <= good) finish();
      },
      (e) => {
        if (e.code === 1) finish(new LocateError('denied'));
        else lastError = e.code === 2 ? 'unavailable' : 'timeout';
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
  });
}
