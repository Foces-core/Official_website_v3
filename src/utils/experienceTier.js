/**
 * Experience-tier seam (architecture report Candidate 2) — the ONE deep
 * module that owns the degradation matrix.
 *
 * Detection stays in detectProfile.js (four raw signals); this module owns
 * what they MEAN. Before it existed, every call site re-derived its own
 * combination dialect — Grain checked slowNetwork || lowCPU, Featuring
 * checked reducedMotion || lowPower, the cube checked lowPower || slowNetwork,
 * ScrollGate/splash checked slowNetwork alone. Delete the policy and it
 * reappeared across a dozen callers; add a fifth signal and every call site
 * changed. Here the matrix lives once:
 *
 *   resolveExperienceTier(profile)       — 'full' | 'lite' | 'minimal'
 *   resolveExperienceCapabilities(profile) — the named capability set
 *
 * Call sites read ONE capability and stop combining booleans. New gates
 * (image caps, font policy) become one-line capability consumers instead of
 * new boolean dialects.
 *
 * The tier matrix (which combination of slowNetwork/lowCPU/reducedMotion
 * yields which tier) and the per-capability policy are pinned by the
 * truth-table spec (tests/unit/experienceTier.spec.js).
 */

export const EXPERIENCE_TIERS = Object.freeze({
  FULL: 'full',
  LITE: 'lite',
  MINIMAL: 'minimal',
});

/**
 * Coarse tier derived from the three degradation signals. The tier alone
 * cannot express every capability (grain survives on reduced-motion devices,
 * prefetch survives on low-CPU ones) — capabilities read the raw flags too —
 * but the tier is the human-facing label ("a 3G phone gets minimal").
 *
 * @param {{ slowNetwork?: boolean, lowCPU?: boolean, reducedMotion?: boolean }} [profile]
 * @returns {'full' | 'lite' | 'minimal'}
 */
export function resolveExperienceTier({
  slowNetwork = false,
  lowCPU = false,
  reducedMotion = false,
} = {}) {
  if (slowNetwork) return EXPERIENCE_TIERS.MINIMAL;
  if (lowCPU || reducedMotion) return EXPERIENCE_TIERS.LITE;
  return EXPERIENCE_TIERS.FULL;
}

/**
 * The capability set — every gate the site consults, derived once. Each
 * capability keeps the exact policy that used to be copy-pasted at its call
 * site:
 *
 *   webgl         — hero WebGL stage            (full only — was !lowPower)
 *   autoplay      — carousel auto-advance       (full only — was !(reducedMotion || lowPower); Execom's narrower reducedMotion-only check is unified here)
 *   cube3d        — Execom 3D cube vs flat      (full only — was !(lowPower || reducedMotion))
 *   idleSpin      — About cube idle auto-rotate (full only — was !(lowPower || slowNetwork))
 *   confetti      — full-strength celebration   (full only — was !lowPower)
 *   aosReveals    — AOS scroll reveals          (full only — was !(reducedMotion || lowPower))
 *   skeletonMotion— animated skeleton bars      (full only — was !lowPower)
 *   grain         — film-grain overlay          (was !(slowNetwork || lowCPU); reduced-motion users keep the static texture)
 *   prefetch      — route-chunk prefetch        (was !slowNetwork)
 *   splash        — boot splash                 (was !slowNetwork)
 *   scrollGate    — idle pre-mount deferral     (was !slowNetwork)
 *   celebrationMotion — wobble/confetti on egg  (was !reducedMotion)
 *   smoothScroll  — animated section scrolling  (was !reducedMotion)
 *   imageMaxWidth — largest srcset candidate    (was resolveMaxImageWidth: slowNetwork ? 400 : lowCPU ? 800 : 1000)
 *
 * @param {{ slowNetwork?: boolean, lowCPU?: boolean, reducedMotion?: boolean }} [profile]
 * @returns {{ tier: string, webgl: boolean, autoplay: boolean, cube3d: boolean,
 *             idleSpin: boolean, confetti: boolean, aosReveals: boolean,
 *             skeletonMotion: boolean, grain: boolean, prefetch: boolean,
 *             splash: boolean, scrollGate: boolean, celebrationMotion: boolean,
 *             smoothScroll: boolean, imageMaxWidth: number }}
 */
export function resolveExperienceCapabilities(profile = {}) {
  const { slowNetwork = false, lowCPU = false, reducedMotion = false } = profile;
  const tier = resolveExperienceTier(profile);
  const full = tier === EXPERIENCE_TIERS.FULL;

  return {
    tier,
    webgl: full,
    autoplay: full,
    cube3d: full,
    idleSpin: full,
    confetti: full,
    aosReveals: full,
    skeletonMotion: full,
    grain: !slowNetwork && !lowCPU,
    prefetch: !slowNetwork,
    splash: !slowNetwork,
    scrollGate: !slowNetwork,
    celebrationMotion: !reducedMotion,
    smoothScroll: !reducedMotion,
    imageMaxWidth: slowNetwork ? 400 : lowCPU ? 800 : 1000,
  };
}
