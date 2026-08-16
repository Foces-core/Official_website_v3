import { srcset } from './srcset.js';

/**
 * An event photo is a single { url, srcset, blur? } object — `url` for
 * `<img src>`, `srcset` for the responsive candidates, and an optional `blur`
 * LQIP for the blur-up placeholder. Pairing them in one object makes the old
 * images[i] ↔ imageSets[i] parallel-array bug class structurally impossible
 * (they were unpaired arrays; EventCard did positional index math).
 *
 * photoTriplet builds the standard {full 1000w, -800 800w, -400 400w} srcset
 * used across events.js. The width-accuracy rule (never declare a file wider
 * than its intrinsic size; never repeat a URL at two widths) lives in
 * validateEvents, which reads these same objects.
 */
export function photoTriplet(full, s800, s400, blur) {
  return {
    url: full,
    srcset: srcset([
      [full, 1000],
      [s800, 800],
      [s400, 400],
    ]),
    ...(blur ? { blur } : {}),
  };
}
