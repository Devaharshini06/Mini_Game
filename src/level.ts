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
const TONES = [PINK, BLUE, PINK2, BLUE2, LILAC] as const

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

function tone(level: number, i: number) {
  return TONES[(level + i) % TONES.length]
}

type Extra = {
  sx?: number
  sz?: number
  kind?: Kind
  extra?: Partial<Spec>
  bit?: boolean
  check?: boolean
  hazard?: 'left' | 'right'
}

class Course {
  readonly specs: Spec[] = []
  private n: number
  private k = 0
  private lastS = 9
  x = 0
  y = 0
  z = 0

  constructor(n: number) {
    this.n = n
    this.specs.push(block(0, 0, 0, 9, 1, 9, 'solid', PINK))
    this.specs.push(block(0, 0.85, -2.6, 1.85, 0.7, 1.85, 'check', CREAM))
  }

  at(x: number, y: number, z: number, s: number, opts: Extra = {}) {
    this.k += 1
    this.x = x
    this.y = y
    this.z = z
    const sx = opts.sx ?? s
    const sz = opts.sz ?? s
    const kind = opts.kind ?? 'solid'
    this.specs.push(block(x, y, z, sx, 1, sz, kind, tone(this.n, this.k), opts.extra ?? {}))
    if (opts.check) this.specs.push(block(x, y + 0.82, z, 1.5, 0.6, 1.5, 'check', CREAM))
    if (opts.bit) this.specs.push(block(x, y + 1.32, z, 0.45, 0.45, 0.45, 'bit', GOLD))
    if (opts.hazard) {
      const side = opts.hazard === 'left' ? 1 : -1
      this.specs.push(block(x + side * (sx * 0.5 + 1.3), y + 0.35, z, 1.1, 1.1, 1.1, 'hazard', HAZARD))
    }
    this.lastS = sz
    return this
  }

  finish() {
    const goal = 3.3
    this.z += this.lastS / 2 + goal / 2 + 1.7
    this.y += 0.28
    this.specs.push(block(0, this.y, this.z, goal, 1.15, goal, 'goal', GOLD))
    this.specs.push(block(0, this.y + 1.12, this.z, 1.35, 1.35, 1.35, 'goal', CREAM))
    return this.specs
  }
}

type Build = (c: Course) => void

const BUILDS: Build[] = [
  (c) => { // 1 straight beginner
    ;[7, 11.4, 15.8, 20, 24, 28, 32].forEach((z, i) => c.at(0, 0.14 * (i + 1), z, 3.6, { bit: i === 2 || i === 5 }))
    c.at(0, 1.12, 36, 3.5)
  },
  (c) => { // 2 tall stairs
    for (let i = 0; i < 9; i++) c.at(0, 0.42 * (i + 1), 6.8 + i * 3.4, 3.2, { bit: i === 2 || i === 6, check: i === 4 })
    c.at(0, 4.0, 38, 3.4)
  },
  (c) => { // 3 left wing
    c.at(0, 0.16, 7, 3.3)
    c.at(3.4, 0.32, 10.6, 3.0, { bit: true })
    c.at(5.6, 0.48, 14.2, 3.0)
    c.at(5.6, 0.64, 18, 3.0, { check: true })
    c.at(3.2, 0.8, 21.6, 3.0, { bit: true })
    c.at(0, 0.96, 25.4, 3.3)
    c.at(0, 1.1, 29.2, 3.3)
  },
  (c) => { // 4 right wing
    c.at(0, 0.16, 7, 3.3)
    c.at(-3.4, 0.32, 10.6, 3.0, { bit: true })
    c.at(-5.6, 0.48, 14.2, 3.0)
    c.at(-5.6, 0.64, 18, 3.0, { check: true })
    c.at(-3.2, 0.8, 21.6, 3.0, { bit: true })
    c.at(0, 0.96, 25.4, 3.3)
    c.at(0, 1.1, 29.2, 3.3)
  },
  (c) => { // 5 giant then pebbles
    c.at(0, 0.12, 8, 5.2)
    c.at(0, 0.28, 13.2, 2.3, { bit: true })
    c.at(0, 0.44, 16.4, 2.2)
    c.at(0, 0.6, 19.6, 2.2, { check: true })
    c.at(0, 0.76, 22.8, 2.2, { bit: true })
    c.at(0, 0.92, 26.4, 3.4)
    c.at(0, 1.06, 30.2, 3.4)
  },
  (c) => { // 6 U-turn
    c.at(0, 0.16, 7.2, 3.2)
    c.at(0, 0.32, 11.4, 3.1, { bit: true })
    c.at(4.2, 0.48, 11.4, 3.0)
    c.at(4.2, 0.64, 16, 3.0, { check: true })
    c.at(0, 0.8, 16, 3.0, { bit: true })
    c.at(0, 0.96, 20.6, 3.2)
    c.at(0, 1.1, 24.4, 3.3)
  },
  (c) => { // 7 reverse U
    c.at(0, 0.16, 7.2, 3.2)
    c.at(0, 0.32, 11.4, 3.1, { bit: true })
    c.at(-4.2, 0.48, 11.4, 3.0)
    c.at(-4.2, 0.64, 16, 3.0, { check: true })
    c.at(0, 0.8, 16, 3.0, { bit: true })
    c.at(0, 0.96, 20.6, 3.2)
    c.at(0, 1.1, 24.4, 3.3)
  },
  (c) => { // 8 long plank
    c.at(0, 0.16, 7, 3.3)
    c.at(0, 0.3, 14.5, 2.0, { sx: 1.7, sz: 10, bit: true })
    c.at(0, 0.46, 21.4, 3.1, { check: true })
    c.at(0, 0.62, 28.2, 1.9, { sx: 1.65, sz: 9, bit: true })
    c.at(0, 0.78, 34.4, 3.3)
    c.at(0, 0.94, 38.2, 3.3)
  },
  (c) => { // 9 switchbacks
    c.at(0, 0.16, 7, 3.1)
    c.at(4.4, 0.36, 10.6, 2.9, { bit: true })
    c.at(-4.4, 0.56, 14.4, 2.9)
    c.at(4.4, 0.76, 18.2, 2.9, { check: true })
    c.at(-4.4, 0.96, 22, 2.9, { bit: true })
    c.at(0, 1.16, 26, 3.2)
    c.at(0, 1.3, 29.8, 3.2)
  },
  (c) => { // 10 ring
    const ring = [
      [0, 7.2], [3.6, 10], [5.2, 14], [3.6, 18], [0, 20.6], [-3.6, 18], [-5.2, 14], [-3.6, 10],
    ]
    ring.forEach(([x, z], i) => c.at(x, 0.18 * (i + 1), z, 2.7, { bit: i === 2 || i === 6, check: i === 4 }))
    c.at(0, 1.7, 24.4, 3.3)
  },
  (c) => { // 11 split Y
    c.at(0, 0.16, 7, 3.2)
    c.at(0, 0.3, 11, 3.0, { bit: true })
    c.at(3.3, 0.48, 15.2, 2.8)
    c.at(-3.3, 0.48, 15.2, 2.8)
    c.at(3.3, 0.66, 19, 2.8, { check: true })
    c.at(-3.3, 0.66, 19, 2.8)
    c.at(0, 0.86, 23.2, 3.2, { bit: true })
    c.at(0, 1.02, 27, 3.3)
  },
  (c) => { // 12 spiral climb
    for (let i = 0; i < 10; i++) {
      const a = i * 0.62
      c.at(Math.sin(a) * 5.2, 0.28 * (i + 1), 8 + i * 2.05, 2.65, { bit: i === 3 || i === 7, check: i === 5 })
    }
    c.at(0, 3.1, 29.5, 3.3)
  },
  (c) => { // 13 pyramid
    ;[[4.6, 7.2], [3.6, 11], [2.7, 14.6], [2.2, 18], [2.7, 21.4], [3.6, 25], [4.4, 28.8]].forEach(([s, z], i) => {
      c.at(0, 0.16 * (i + 1), z, s, { bit: i === 2 || i === 5, check: i === 3 })
    })
    c.at(0, 1.28, 32.6, 3.3)
  },
  (c) => { // 14 T junction
    c.at(0, 0.16, 7.2, 3.2)
    c.at(0, 0.32, 12.4, 2.4, { sx: 9.5, sz: 2.4, bit: true })
    c.at(-4.4, 0.5, 16.4, 2.8)
    c.at(4.4, 0.5, 16.4, 2.8)
    c.at(0, 0.7, 16.4, 2.9, { check: true })
    c.at(0, 0.88, 20.6, 3.1, { bit: true })
    c.at(0, 1.04, 24.4, 3.3)
  },
  (c) => { // 15 diagonal climb
    for (let i = 0; i < 8; i++) {
      c.at(-4.2 + i * 1.05, 0.22 * (i + 1), 7.2 + i * 3.15, 2.8, { bit: i === 2 || i === 6, check: i === 4 })
    }
    c.at(0, 2.0, 33.2, 3.3)
  },
  (c) => { // 16 wide plaza
    c.at(0, 0.12, 8, 6.4)
    c.at(-3.2, 0.3, 13.2, 2.8, { bit: true })
    c.at(3.2, 0.3, 13.2, 2.8)
    c.at(0, 0.5, 17.6, 3.4, { check: true })
    c.at(0, 0.68, 21.6, 3.0, { bit: true })
    c.at(0, 0.84, 25.4, 3.3)
    c.at(0, 1.0, 29.2, 3.3)
  },
  (c) => { // 17 first movers
    c.at(0, 0.16, 7, 3.2)
    c.at(0, 0.34, 11.6, 2.6, { kind: 'moveX', extra: { amp: 2.4, speed: 0.8 }, bit: true })
    c.at(0, 0.52, 16.4, 3.0, { check: true })
    c.at(0, 0.7, 21.2, 2.6, { kind: 'moveX', extra: { amp: 2.4, speed: 0.85, phase: 1.6 }, bit: true })
    c.at(0, 0.88, 26, 3.2)
    c.at(0, 1.04, 29.8, 3.3)
  },
  (c) => { // 18 bounce tower
    c.at(0, 0.16, 7, 3.2)
    c.at(0, 0.32, 11, 2.4, { kind: 'bounce', bit: true })
    c.at(0, 2.2, 15.2, 3.0, { check: true })
    c.at(0, 2.4, 19, 2.4, { kind: 'bounce' })
    c.at(0, 4.25, 23.4, 3.0, { bit: true })
    c.at(0, 4.42, 27.2, 3.3)
    c.at(0, 4.56, 31, 3.3)
  },
  (c) => { // 19 fall tiles
    c.at(0, 0.16, 7, 3.2)
    c.at(0, 0.36, 11.2, 2.5, { kind: 'fall', bit: true })
    c.at(0, 0.56, 15.2, 2.5, { kind: 'fall' })
    c.at(0, 0.76, 19.4, 3.0, { check: true })
    c.at(0, 0.96, 23.4, 2.5, { kind: 'fall', bit: true })
    c.at(0, 1.16, 27.6, 3.2)
    c.at(0, 1.3, 31.4, 3.3)
  },
  (c) => { // 20 S river
    c.at(0, 0.16, 7, 3.1)
    c.at(4.6, 0.36, 11.2, 2.9, { bit: true })
    c.at(4.6, 0.52, 15.4, 2.9)
    c.at(0, 0.7, 19.4, 3.0, { check: true })
    c.at(-4.6, 0.88, 23.4, 2.9, { bit: true })
    c.at(-4.6, 1.04, 27.6, 2.9)
    c.at(0, 1.22, 31.6, 3.3)
    c.at(0, 1.36, 35.4, 3.3)
  },
  (c) => { // 21 plus cross
    c.at(0, 0.16, 7.2, 3.1)
    c.at(0, 0.32, 12.6, 2.3, { sx: 10, sz: 2.3, bit: true })
    c.at(0, 0.5, 16.8, 2.3, { sx: 2.3, sz: 6.4, check: true })
    c.at(0, 0.68, 22.2, 3.0, { bit: true })
    c.at(0, 0.84, 26, 3.3)
    c.at(0, 1.0, 29.8, 3.3)
  },
  (c) => { // 22 staircase wrap
    c.at(0, 0.2, 7, 3.0)
    c.at(3.8, 0.55, 10.4, 2.8, { bit: true })
    c.at(3.8, 0.95, 14.2, 2.8)
    c.at(0, 1.35, 17.8, 2.9, { check: true })
    c.at(-3.8, 1.75, 21.4, 2.8, { bit: true })
    c.at(-3.8, 2.15, 25.2, 2.8)
    c.at(0, 2.55, 29, 3.2)
    c.at(0, 2.72, 32.8, 3.3)
  },
  (c) => { // 23 z-ferries
    c.at(0, 0.16, 7, 3.2)
    c.at(0, 0.38, 12.2, 2.6, { sx: 2.8, sz: 2.4, kind: 'moveZ', extra: { amp: 1.5, speed: 0.85 }, bit: true })
    c.at(0, 0.58, 17.6, 3.0, { check: true })
    c.at(0, 0.8, 22.8, 2.6, { sx: 2.8, sz: 2.4, kind: 'moveZ', extra: { amp: 1.5, speed: 0.9, phase: 2 }, bit: true })
    c.at(0, 1.0, 28.2, 3.2)
    c.at(0, 1.16, 32, 3.3)
  },
  (c) => { // 24 tiny hopscotch
    for (let i = 0; i < 12; i++) {
      c.at((i % 2 === 0 ? 0.9 : -0.9), 0.14 * (i + 1), 6.6 + i * 2.55, 2.15, { bit: i === 3 || i === 9, check: i === 6 })
    }
    c.at(0, 1.82, 38.2, 3.3)
  },
  (c) => { // 25 double lane
    for (let i = 0; i < 6; i++) {
      const z = 7.2 + i * 3.6
      const y = 0.18 * (i + 1)
      c.at(-2.6, y, z, 2.5, { bit: i === 1, check: i === 3 })
      c.at(2.6, y, z, 2.5, { bit: i === 4 })
    }
    c.at(0, 1.3, 29.6, 3.4)
  },
  (c) => { // 26 bounce left tower
    c.at(0, 0.16, 7, 3.1)
    c.at(0, 0.32, 11, 2.3, { kind: 'bounce', bit: true })
    c.at(4.2, 2.2, 15, 2.9, { check: true })
    c.at(4.2, 2.4, 18.8, 2.3, { kind: 'bounce' })
    c.at(0, 4.25, 23, 3.0, { bit: true })
    c.at(0, 4.42, 26.8, 3.3)
    c.at(0, 4.56, 30.6, 3.3)
  },
  (c) => { // 27 hazard sides
    c.at(0, 0.16, 7, 3.1)
    c.at(0, 0.34, 11.2, 2.7, { bit: true, hazard: 'left' })
    c.at(0, 0.52, 15.4, 2.6, { hazard: 'right' })
    c.at(0, 0.7, 19.6, 2.8, { check: true })
    c.at(0, 0.88, 23.8, 2.6, { bit: true, hazard: 'left' })
    c.at(0, 1.06, 27.8, 3.2)
    c.at(0, 1.2, 31.6, 3.3)
  },
  (c) => { // 28 square loop
    c.at(0, 0.16, 7.4, 3.0)
    c.at(5.0, 0.36, 7.4, 2.8, { bit: true })
    c.at(5.0, 0.56, 12.4, 2.8)
    c.at(5.0, 0.76, 17.4, 2.8, { check: true })
    c.at(0, 0.96, 17.4, 2.8, { bit: true })
    c.at(-5.0, 1.16, 17.4, 2.8)
    c.at(-5.0, 1.36, 22.6, 2.8)
    c.at(0, 1.56, 22.6, 3.1)
    c.at(0, 1.72, 26.6, 3.3)
  },
  (c) => { // 29 elevators
    c.at(0, 0.16, 7, 3.1)
    c.at(0, 0.5, 11.6, 2.6, { kind: 'moveY', extra: { amp: 0.95, speed: 0.88 }, bit: true })
    c.at(0, 1.2, 16.4, 3.0, { check: true })
    c.at(0, 1.55, 21.2, 2.6, { kind: 'moveY', extra: { amp: 0.95, speed: 0.92, phase: 1.5 }, bit: true })
    c.at(0, 2.3, 26, 3.2)
    c.at(0, 2.46, 29.8, 3.3)
  },
  (c) => { // 30 mountain trail
    c.at(0, 0.16, 7, 3.1)
    c.at(3.8, 0.5, 10.8, 2.8, { bit: true })
    c.at(3.8, 0.9, 14.6, 2.8)
    c.at(0, 1.3, 18.2, 2.9, { check: true })
    c.at(-3.8, 1.7, 21.8, 2.8, { bit: true })
    c.at(-3.8, 2.1, 25.6, 2.8)
    c.at(0, 2.5, 29.4, 3.2)
    c.at(0, 2.68, 33.2, 3.3)
  },
  (c) => { // 31 three movers
    c.at(0, 0.16, 7, 3.1)
    c.at(0, 0.36, 11.6, 2.45, { kind: 'moveX', extra: { amp: 2.2, speed: 0.88 }, bit: true })
    c.at(0, 0.56, 16.4, 2.45, { kind: 'moveX', extra: { amp: 2.2, speed: 0.9, phase: 1.2 } })
    c.at(0, 0.76, 21.2, 2.9, { check: true })
    c.at(0, 0.96, 26, 2.45, { kind: 'moveX', extra: { amp: 2.0, speed: 0.86, phase: 2.1 }, bit: true })
    c.at(0, 1.16, 30.6, 3.2)
    c.at(0, 1.3, 34.4, 3.3)
  },
  (c) => { // 32 skinny stairs
    for (let i = 0; i < 11; i++) {
      c.at(0, 0.26 * (i + 1), 6.8 + i * 2.7, 2.15, { bit: i === 2 || i === 8, check: i === 5 })
    }
    c.at(0, 3.08, 37.4, 3.3)
  },
  (c) => { // 33 wave
    for (let i = 0; i < 9; i++) {
      c.at(Math.sin(i * 0.85) * 5.4, 0.2 * (i + 1), 7 + i * 3.15, 2.7, { bit: i === 2 || i === 6, check: i === 4 })
    }
    c.at(0, 2.02, 36.2, 3.3)
  },
  (c) => { // 34 bounce ferry mix
    c.at(0, 0.16, 7, 3.0)
    c.at(0, 0.36, 11.4, 2.5, { kind: 'moveX', extra: { amp: 2.0, speed: 0.9 }, bit: true })
    c.at(0, 0.54, 15.6, 2.3, { kind: 'bounce' })
    c.at(-3.6, 2.4, 19.6, 2.8, { check: true })
    c.at(0, 2.6, 23.6, 2.5, { kind: 'moveX', extra: { amp: 1.8, speed: 0.88 }, bit: true })
    c.at(0, 2.82, 28, 3.2)
    c.at(0, 2.96, 31.8, 3.3)
  },
  (c) => { // 35 fan
    c.at(0, 0.16, 7.2, 3.1)
    ;[-5.2, -2.6, 0, 2.6, 5.2].forEach((x, i) => c.at(x, 0.36, 12.2, 2.45, { bit: i === 0 || i === 4, check: i === 2 }))
    c.at(0, 0.58, 16.8, 3.1)
    c.at(0, 0.76, 20.8, 3.0, { bit: true })
    c.at(0, 0.92, 24.6, 3.3)
    c.at(0, 1.08, 28.4, 3.3)
  },
  (c) => { // 36 fall sandwich
    c.at(0, 0.16, 7, 3.1)
    c.at(0, 0.34, 11, 2.9, { bit: true })
    c.at(0, 0.54, 15, 2.4, { kind: 'fall' })
    c.at(0, 0.74, 19.2, 2.9, { check: true })
    c.at(0, 0.94, 23.2, 2.4, { kind: 'fall' })
    c.at(0, 1.14, 27.2, 2.4, { kind: 'fall', bit: true })
    c.at(0, 1.34, 31.4, 3.2)
    c.at(0, 1.48, 35.2, 3.3)
  },
  (c) => { // 37 helix
    for (let i = 0; i < 11; i++) {
      const a = i * 0.7
      c.at(Math.cos(a) * 4.6, 0.32 * (i + 1), 7.4 + i * 1.95, 2.55, { bit: i === 3 || i === 8, check: i === 5 })
    }
    c.at(0, 3.72, 30.2, 3.3)
  },
  (c) => { // 38 checker hops
    const pts = [[2.2, 7], [-2.2, 10.4], [2.2, 13.8], [-2.2, 17.2], [2.2, 20.6], [-2.2, 24], [0, 27.6]]
    pts.forEach(([x, z], i) => c.at(x, 0.22 * (i + 1), z, 2.55, { bit: i === 1 || i === 4, check: i === 3 }))
    c.at(0, 1.76, 31.4, 3.3)
  },
  (c) => { // 39 long hallway
    c.at(0, 0.16, 8, 3.2)
    c.at(0, 0.3, 16.5, 2.2, { sx: 2.0, sz: 12, bit: true })
    c.at(0, 0.48, 24.8, 3.0, { check: true })
    c.at(3.4, 0.66, 29, 2.7, { bit: true })
    c.at(0, 0.84, 33.2, 3.2)
    c.at(0, 1.0, 37, 3.3)
  },
  (c) => { // 40 hazard weave
    c.at(0, 0.16, 7, 3.0)
    c.at(2.4, 0.38, 11.2, 2.5, { bit: true, hazard: 'right' })
    c.at(-2.4, 0.6, 15.6, 2.5, { hazard: 'left' })
    c.at(2.4, 0.82, 20, 2.5, { check: true, hazard: 'right' })
    c.at(-2.4, 1.04, 24.4, 2.5, { bit: true, hazard: 'left' })
    c.at(0, 1.26, 28.8, 3.2)
    c.at(0, 1.4, 32.6, 3.3)
  },
  (c) => { // 41 two towers
    c.at(0, 0.16, 7, 3.0)
    c.at(0, 0.32, 11, 2.3, { kind: 'bounce', bit: true })
    c.at(-4.4, 2.2, 15.2, 2.8, { check: true })
    c.at(-4.4, 2.4, 18.8, 2.3, { kind: 'bounce' })
    c.at(4.0, 4.25, 23, 2.8, { bit: true })
    c.at(0, 4.5, 27.4, 3.2)
    c.at(0, 4.66, 31.2, 3.3)
  },
  (c) => { // 42 slalom
    const xs = [0, 4.8, -4.8, 4.8, -4.8, 3.2, 0]
    xs.forEach((x, i) => c.at(x, 0.22 * (i + 1), 7 + i * 3.4, 2.7, { bit: i === 1 || i === 4, check: i === 3 }))
    c.at(0, 1.76, 31.6, 3.3)
  },
  (c) => { // 43 mix gauntlet
    c.at(0, 0.16, 7, 3.0)
    c.at(0, 0.36, 11.4, 2.5, { kind: 'moveX', extra: { amp: 1.9, speed: 0.9 }, bit: true })
    c.at(0, 0.54, 15.6, 2.4, { kind: 'fall' })
    c.at(0, 0.74, 20, 2.8, { check: true })
    c.at(0, 0.92, 24, 2.3, { kind: 'bounce' })
    c.at(0, 2.8, 28.2, 3.0, { bit: true })
    c.at(0, 2.96, 32, 3.3)
  },
  (c) => { // 44 rising zigzag
    const xs = [0, 3.6, -3.4, 3.8, -3.6, 2.4, 0]
    xs.forEach((x, i) => c.at(x, 0.4 * (i + 1), 7 + i * 3.2, 2.65, { bit: i === 1 || i === 4, check: i === 3 }))
    c.at(0, 3.02, 30.2, 3.3)
  },
  (c) => { // 45 ferry chain
    c.at(0, 0.16, 7, 3.0)
    c.at(0, 0.38, 12, 2.45, { kind: 'moveZ', extra: { amp: 1.3, speed: 0.9 }, bit: true })
    c.at(0, 0.58, 17.2, 2.45, { kind: 'moveX', extra: { amp: 2.0, speed: 0.88 } })
    c.at(0, 0.78, 22.2, 2.9, { check: true })
    c.at(0, 1.0, 27.2, 2.45, { kind: 'moveZ', extra: { amp: 1.25, speed: 0.95, phase: 1.7 }, bit: true })
    c.at(0, 1.2, 32.2, 3.2)
    c.at(0, 1.34, 36, 3.3)
  },
  (c) => { // 46 horseshoe
    c.at(0, 0.16, 7.2, 3.0)
    c.at(5.2, 0.36, 11, 2.8, { bit: true })
    c.at(5.2, 0.56, 16, 2.8)
    c.at(5.2, 0.76, 21, 2.8, { check: true })
    c.at(0, 0.96, 24.6, 2.9, { bit: true })
    c.at(-5.2, 1.16, 21, 2.8)
    c.at(-5.2, 1.36, 16, 2.8)
    c.at(0, 1.56, 28.6, 3.2)
    c.at(0, 1.72, 32.4, 3.3)
  },
  (c) => { // 47 cluster parks
    c.at(0, 0.16, 7, 3.0)
    c.at(-3.4, 0.4, 11.4, 2.5, { bit: true })
    c.at(3.4, 0.4, 11.4, 2.5)
    c.at(-3.4, 0.7, 15.8, 2.5)
    c.at(3.4, 0.7, 15.8, 2.5, { check: true })
    c.at(0, 1.0, 20.2, 2.8, { bit: true })
    c.at(0, 1.2, 24.2, 3.1)
    c.at(0, 1.36, 28, 3.3)
  },
  (c) => { // 48 long expert
    c.at(0, 0.16, 7, 3.0)
    c.at(3.4, 0.4, 11, 2.55, { bit: true })
    c.at(0, 0.62, 15.4, 2.4, { kind: 'moveX', extra: { amp: 1.8, speed: 0.92 } })
    c.at(-3.2, 0.86, 19.8, 2.55, { check: true })
    c.at(0, 1.08, 24, 2.35, { kind: 'fall' })
    c.at(0, 1.3, 28.2, 2.6, { bit: true })
    c.at(0, 1.48, 32, 2.25, { kind: 'bounce' })
    c.at(0, 3.35, 36.2, 3.2)
    c.at(0, 3.5, 40, 3.3)
  },
  (c) => { // 49 canyon
    c.at(0, 0.16, 7, 3.0)
    c.at(-4.6, 0.4, 11.4, 2.6, { bit: true })
    c.at(-4.6, 0.7, 15.6, 2.5, { sx: 1.8, sz: 5.6 })
    c.at(-4.6, 1.0, 20.8, 2.6, { check: true })
    c.at(0, 1.3, 24.8, 2.8, { bit: true })
    c.at(4.6, 1.6, 28.8, 2.6)
    c.at(0, 1.9, 33, 3.2)
    c.at(0, 2.06, 36.8, 3.3)
  },
  (c) => { // 50 finale spiral mix
    c.at(0, 0.16, 7, 3.15)
    c.at(0, 0.34, 11, 2.7, { bit: true })
    c.at(4.2, 0.6, 14.8, 2.55)
    c.at(0, 0.86, 19, 2.4, { kind: 'moveX', extra: { amp: 2.0, speed: 0.9 }, check: true })
    c.at(-4.0, 1.12, 23.4, 2.55, { bit: true })
    c.at(0, 1.36, 27.4, 2.35, { kind: 'fall' })
    c.at(0, 1.7, 31.4, 2.45, { kind: 'moveY', extra: { amp: 0.75, speed: 0.92 } })
    c.at(0, 2.35, 35.2, 2.25, { kind: 'bounce' })
    c.at(0, 4.2, 39.2, 2.9, { hazard: 'right' })
    c.at(0, 4.4, 43, 3.3)
  },
]

export function buildLevel(level: number): Spec[] {
  const n = Math.max(1, Math.min(LEVEL_MAX, Math.round(level)))
  const course = new Course(n)
  BUILDS[n - 1](course)
  return course.finish()
}

export function courseEnd(specs: Spec[]) {
  let max = 1
  for (const spec of specs) {
    if (spec.kind === 'goal') max = Math.max(max, spec.z)
  }
  return max
}
