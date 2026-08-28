const MOVE = new Set([
  'arrowleft',
  'arrowright',
  'arrowup',
  'arrowdown',
  'keyw',
  'keya',
  'keys',
  'keyd',
  'space',
])

export class Input {
  x = 0
  z = 0
  jumpHeld = false
  jumpQueued = false

  private keys = new Set<string>()
  private stickX = 0
  private stickZ = 0

  attach() {
    window.addEventListener('keydown', this.onKey, { capture: true })
    window.addEventListener('keyup', this.onUp, { capture: true })
    window.addEventListener('blur', this.clearKeys)

    const stick = document.getElementById('stick')
    const knob = document.getElementById('knob')
    const hop = document.getElementById('hop')
    if (stick && knob) this.bindStick(stick, knob)
    hop?.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      this.jumpHeld = true
      this.jumpQueued = true
    })
    hop?.addEventListener('pointerup', () => {
      this.jumpHeld = false
    })
  }

  consumeJump() {
    const ready = this.jumpQueued
    this.jumpQueued = false
    return ready
  }

  releaseAll() {
    this.keys.clear()
    this.jumpHeld = false
    this.jumpQueued = false
    this.stickX = 0
    this.stickZ = 0
  }

  sample() {
    let x = this.stickX
    let z = this.stickZ
    // Camera looks along +Z, so screen-left is +X and screen-right is -X.
    if (this.keys.has('keya') || this.keys.has('arrowleft')) x += 1
    if (this.keys.has('keyd') || this.keys.has('arrowright')) x -= 1
    if (this.keys.has('keyw') || this.keys.has('arrowup')) z += 1
    if (this.keys.has('keys') || this.keys.has('arrowdown')) z -= 1
    const mag = Math.hypot(x, z)
    if (mag > 1) {
      x /= mag
      z /= mag
    }
    this.x = x
    this.z = z
  }

  private normalize(event: KeyboardEvent) {
    const code = event.code.toLowerCase()
    if (MOVE.has(code)) return code
    const key = event.key.toLowerCase()
    if (key === 'arrowleft' || key === 'left') return 'arrowleft'
    if (key === 'arrowright' || key === 'right') return 'arrowright'
    if (key === 'arrowup' || key === 'up') return 'arrowup'
    if (key === 'arrowdown' || key === 'down') return 'arrowdown'
    if (key === ' ' || key === 'space' || key === 'spacebar') return 'space'
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') return `key${key}`
    return ''
  }

  private onKey = (event: KeyboardEvent) => {
    const key = this.normalize(event)
    if (!MOVE.has(key)) return
    event.preventDefault()
    this.keys.add(key)
    if (key === 'space' && !event.repeat) {
      this.jumpHeld = true
      this.jumpQueued = true
    }
  }

  private onUp = (event: KeyboardEvent) => {
    const key = this.normalize(event)
    if (!key) return
    this.keys.delete(key)
    if (key === 'space') this.jumpHeld = false
  }

  private clearKeys = () => {
    this.keys.clear()
    this.jumpHeld = false
  }

  private bindStick(stick: HTMLElement, knob: HTMLElement) {
    const radius = 33
    const set = (clientX: number, clientY: number) => {
      const box = stick.getBoundingClientRect()
      const cx = box.left + box.width / 2
      const cy = box.top + box.height / 2
      let dx = clientX - cx
      let dy = clientY - cy
      const mag = Math.hypot(dx, dy) || 1
      const cap = Math.min(mag, 40)
      dx = (dx / mag) * cap
      dy = (dy / mag) * cap
      knob.style.left = `${radius + dx}px`
      knob.style.top = `${radius + dy}px`
      this.stickX = -dx / 40
      this.stickZ = -dy / 40
    }
    const clear = () => {
      knob.style.left = '33px'
      knob.style.top = '33px'
      this.stickX = 0
      this.stickZ = 0
    }
    stick.addEventListener('pointerdown', (event) => {
      stick.setPointerCapture(event.pointerId)
      set(event.clientX, event.clientY)
    })
    stick.addEventListener('pointermove', (event) => {
      if (!stick.hasPointerCapture(event.pointerId)) return
      set(event.clientX, event.clientY)
    })
    stick.addEventListener('pointerup', clear)
    stick.addEventListener('pointercancel', clear)
  }
}
