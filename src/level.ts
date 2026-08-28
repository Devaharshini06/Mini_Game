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

const PINK = 0xff9ec8
const PINK2 = 0xff7ab4
const BLUE = 0x7ecbff
const BLUE2 = 0x4ea8ff
const LILAC = 0xe3d4ff
const CREAM = 0xfff0f8
const HAZARD = 0xff4f8a
const GOLD = 0xffe08a

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

export function buildCourse(): Spec[] {
  const p: Spec[] = []
  const add = (...items: Spec[]) => p.push(...items)

  add(block(0, 0, 0, 10, 1, 10, 'solid', PINK))
  add(block(0, 0.9, -3.4, 2, 0.8, 2, 'check', CREAM))

  add(block(0, 0.2, 9, 3.2, 1, 3.2, 'solid', BLUE))
  add(block(0, 0.5, 15, 2.6, 1, 2.6, 'solid', PINK2))
  add(block(0, 0.9, 21, 2.4, 1, 2.4, 'solid', BLUE2))
  add(block(2.4, 1.2, 27, 2.2, 1, 2.2, 'solid', PINK))
  add(block(-2.2, 1.6, 33, 2.2, 1, 2.2, 'solid', BLUE))
  add(block(0, 2, 40, 4, 1, 4, 'check', CREAM))

  add(block(0, 2, 48, 2.4, 1, 2.4, 'moveX', PINK2, { amp: 3.2, speed: 1.1 }))
  add(block(0, 2.4, 56, 2.2, 1, 2.2, 'moveX', BLUE, { amp: 3.6, speed: 1.35, phase: 1.2 }))
  add(block(0, 2.8, 64, 2.4, 1, 2.4, 'solid', LILAC))
  add(block(0, 2.8, 70, 2, 1, 6, 'solid', PINK))
  add(block(0, 3.2, 78, 3.4, 1, 3.4, 'check', CREAM))

  add(block(0, 3.2, 86, 2.2, 1, 2.2, 'bounce', BLUE2))
  add(block(-4, 6.2, 94, 2.6, 1, 2.6, 'solid', PINK))
  add(block(0, 6.6, 102, 2.2, 1, 2.2, 'bounce', PINK2))
  add(block(4.2, 9.4, 110, 2.4, 1, 2.4, 'solid', BLUE))
  add(block(0, 9.8, 118, 3.6, 1, 3.6, 'check', CREAM))

  add(block(0, 9.8, 126, 1.35, 1, 8, 'solid', LILAC))
  add(block(0, 10.2, 136, 1.2, 1, 6, 'solid', PINK2))
  add(block(2.6, 10.6, 144, 2, 1, 2, 'moveZ', BLUE, { amp: 2.4, speed: 1.2 }))
  add(block(-2.4, 11, 152, 2, 1, 2, 'moveZ', PINK, { amp: 2.2, speed: 1.4, phase: 2 }))
  add(block(0, 11.4, 160, 3.2, 1, 3.2, 'check', CREAM))

  add(block(0, 11.4, 168, 2.3, 1, 2.3, 'fall', BLUE2))
  add(block(0, 11.8, 174, 2.2, 1, 2.2, 'fall', PINK2))
  add(block(0, 12.2, 180, 2.1, 1, 2.1, 'fall', BLUE))
  add(block(3.2, 12.6, 186, 2.2, 1, 2.2, 'solid', PINK))
  add(block(0, 13, 193, 3.4, 1, 3.4, 'check', CREAM))

  add(block(0, 13, 201, 2.4, 1, 2.4, 'solid', LILAC))
  add(block(3.4, 13.2, 207, 1.6, 1.6, 1.6, 'hazard', HAZARD))
  add(block(-3.4, 13.2, 213, 1.6, 1.6, 1.6, 'hazard', HAZARD))
  add(block(0, 13.4, 219, 2.2, 1, 2.2, 'solid', PINK))
  add(block(0, 13.4, 224.5, 1.7, 1.7, 1.7, 'hazard', HAZARD))
  add(block(0, 13.8, 231, 2.4, 1, 2.4, 'moveY', BLUE2, { amp: 1.4, speed: 1.15 }))
  add(block(0, 15.4, 239, 3.6, 1, 3.6, 'check', CREAM))

  add(block(-3, 15.8, 247, 2, 1, 2, 'solid', PINK))
  add(block(3, 16.2, 254, 2, 1, 2, 'solid', BLUE))
  add(block(0, 16.8, 262, 2.2, 1, 2.2, 'bounce', PINK2))
  add(block(0, 20.2, 270, 4.4, 1.2, 4.4, 'goal', GOLD))
  add(block(0, 21.4, 270, 1.6, 1.6, 1.6, 'goal', CREAM))

  const bits = [
    [0, 2.2, 15],
    [3.2, 3.4, 48],
    [-3.6, 4.2, 56],
    [0, 5.4, 86],
    [0, 12.2, 126],
    [0, 13.8, 174],
    [2.2, 15.4, 219],
    [0, 18.4, 262],
  ] as const
  for (const [x, y, z] of bits) {
    add(block(x, y, z, 0.45, 0.45, 0.45, 'bit', GOLD))
  }

  return p
}
