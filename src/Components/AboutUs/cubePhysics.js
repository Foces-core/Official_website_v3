// Pure wind-down physics for the About cube — unit-tested. These constants
// and formulas used to live inline in AboutUs.jsx, where every tuning tweak
// risked the feel of the spin. The component applies transforms and rAF
// scheduling; this module owns the math.
export const CUBE_PHYSICS = {
  dragSensitivity: 0.6, // deg of rotation per pixel of horizontal drag
  normalWindFriction: 0.92, // per-frame velocity decay for normal spins — snappy stop
  rapidWindFriction: 0.975, // slower decay for rapid spins — smooth long glide
  rapidSpeedThreshold: 2.5, // release speed (deg/frame) that triggers rapid wind-down
  normalMaxWindSpeed: 4, // deg/frame cap for normal spins
  rapidMaxWindSpeed: 9, // deg/frame cap for rapid spins
  minWindSpeed: 0.05, // deg/frame — below this the cube snaps to a face
  snapMs: 400, // how long the settle-to-face animation takes
};

export const DEG_PER_FRAME = 1000 / 60; // deg/ms -> deg/frame at 60fps

// Settle an angle onto the nearest 90° cube face.
export function snapAngle(rot) {
  return Math.round(rot / 90) * 90;
}

// Split an accumulated angle into whole 90° spins and the leftover remainder
// — the drag accumulator used to `while (accum >= 90)` inline in AboutUs.jsx.
// No spin until a full threshold is crossed: negative or sub-threshold
// accumulation yields 0 spins and keeps the accumulator unchanged, exactly
// what the old inline loop did.
export function splitSpins(accumulated, threshold = 90) {
  if (accumulated < threshold) return { spins: 0, remainder: accumulated };
  return {
    spins: Math.floor(accumulated / threshold),
    remainder: accumulated % threshold,
  };
}

// One wind-down step: decay the per-frame velocity by the friction.
export function windStepVelocity(vel, friction) {
  return vel * friction;
}

// True when the wind-down is slow enough to settle onto a face.
export function isWindStopped(vel, minSpeed = CUBE_PHYSICS.minWindSpeed) {
  return Math.abs(vel) < minSpeed;
}

// Resolve a drag-release velocity (deg/ms) into wind-down parameters, or
// null when the release is too slow to wind down (the caller snaps instead).
export function resolveWindDown(velYms, physics = CUBE_PHYSICS) {
  const vy = velYms * DEG_PER_FRAME;
  const speed = Math.abs(vy);
  if (speed <= physics.minWindSpeed) return null;
  const rapid = speed >= physics.rapidSpeedThreshold;
  const maxSpeed = rapid ? physics.rapidMaxWindSpeed : physics.normalMaxWindSpeed;
  const friction = rapid ? physics.rapidWindFriction : physics.normalWindFriction;
  const scale = Math.min(speed, maxSpeed) / speed;
  return { velocity: vy * scale, friction, rapid };
}
