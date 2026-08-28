export type Kind =
  | 'solid'
  | 'moveX'
  | 'moveZ'
  | 'moveY'
  | 'fall'
  | 'bounce'
  | 'hazard'
  | 'check'
  | 'goal'
  | 'bit'

export type Spec = {
  x: number
  y: number
  z: number
  sx: number
  sy: number
  sz: number
  kind: Kind
  color: number
  amp?: number
  speed?: number
  phase?: number
}

export const LEVEL_MAX = 50

const PINK = 0xff9ec8
const PINK2 = 0xff7ab4
const BLUE = 0x7ecbff
const BLUE2 = 0x4ea8ff
const LILAC = 0xe3d4ff
const CREAM = 0xfff0f8
const HAZARD = 0xff4f8a
const GOLD = 0xffe08a
const TONES = [PINK, BLUE, PINK2, BLUE2, LILAC]

function block(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  kind: Kind,
  color: number,
  extra: Partial<Spec> = {},
): Spec {
  return { x, y, z, sx, sy, sz, kind, color, ...extra }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}

function tone(level: number, i: number) {
  return TONES[(level + i) % TONES.length]
}

export function buildLevel(level: number): Spec[] {
  const n = Math.max(1, Math.min(LEVEL_MAX, Math.round(level)))
  const t = (n - 1) / (LEVEL_MAX - 1)
  const p: Spec[] = []
  const add = (...items: Spec[]) => p.push(...items)

  const size = lerp(3.55, 2.2, t * 0.82)
  const clearance = lerp(1.55, 2.4, t)
  const tight = lerp(0.28, 0.85, t)
  const stride = size + clearance
  const rise = lerp(0.14, 0.36, t)
  const steps = 8 + Math.floor(t * 4)
  const lane = n >= 10 ? lerp(1.15, 2.05, Math.min(1, (n - 10) / 16)) : 0

  add(block(0, 0, 0, 9, 1, 9, 'solid', PINK))
  add(block(0, 0.85, -2.6, 1.85, 0.7, 1.85, 'check', CREAM))

  const xs: number[] = []
  let z = 0
  let y = 0

  for (let i = 1; i <= steps; i++) {
    const gap = i === 5 ? size + tight : stride
    z += gap
    y += rise

    let x = 0
    if (lane > 0) {
      const pair = Math.floor((i - 1) / 2) % 3
      x = pair === 0 ? 0 : pair === 1 ? lane : -lane
    }
    if (i === 5 && xs.length >= 4) x = xs[3]
    if (i >= steps - 1) x = 0
    xs.push(x)

    let kind: Kind = 'solid'
    const extra: Partial<Spec> = {}
    const safe = i === 1 || i === 4 || i === 5 || i === steps || i === steps - 1

    if (!safe) {
      if (n >= 18 && i === 3) {
        kind = 'moveX'
        extra.amp = lerp(1.05, 2.1, t)
        extra.speed = lerp(0.7, 1.05, t)
      } else if (n >= 22 && i === 6 && n < 34) {
        kind = 'moveZ'
        extra.amp = 1.15
        extra.speed = 0.9
      } else if (n >= 26 && i === 6) {
        kind = 'bounce'
      } else if (n >= 34 && i === 7) {
        kind = 'fall'
      } else if (n >= 38 && i === 2 && n % 2 === 0) {
        kind = 'moveY'
        extra.amp = 0.7
        extra.speed = 0.95
      }
    }

    add(block(x, y, z, size, 1, size, kind, tone(n, i), extra))

    if (i === Math.floor(steps / 2) && n >= 8) {
      add(block(x, y + 0.82, z, 1.55, 0.62, 1.55, 'check', CREAM))
    }

    if (i === 2 || i === Math.max(3, steps - 1)) {
      add(block(x, y + 1.32, z, 0.45, 0.45, 0.45, 'bit', GOLD))
    }

    if (n >= 42 && i === 6) {
      add(block(x + size * 0.95 + 1.15, y + 0.35, z, 1.15, 1.15, 1.15, 'hazard', HAZARD))
    }
  }

  const goal = Math.max(size + 0.7, 3.15)
  z += size / 2 + goal / 2 + 1.6
  y += 0.32
  add(block(0, y, z, goal, 1.15, goal, 'goal', GOLD))
  add(block(0, y + 1.12, z, 1.35, 1.35, 1.35, 'goal', CREAM))

  return p
}

export function courseEnd(specs: Spec[]) {
  let max = 1
  for (const spec of specs) {
    if (spec.kind === 'goal') max = Math.max(max, spec.z)
  }
  return max
}
