import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Asmr } from './audio'
import { Input } from './input'
import { buildCourse, type Spec } from './level'

const HALF = 0.45
const GRAVITY = -46
const JUMP = 13.8
const BOUNCE = 17
const SPEED = 11.5
const AIR = 26
const GROUND_ACCEL = 58
const FRICTION = 16
const COYOTE = 0.14
const BUFFER = 0.12

type Body = {
  spec: Spec
  mesh: THREE.Mesh
  baseX: number
  baseY: number
  baseZ: number
  x: number
  y: number
  z: number
  prevX: number
  prevY: number
  prevZ: number
  armed: number
  falling: boolean
  gone: number
  taken: boolean
}

function overlap(
  ax: number, ay: number, az: number, ahx: number, ahy: number, ahz: number,
  bx: number, by: number, bz: number, bhx: number, bhy: number, bhz: number,
) {
  return (
    Math.abs(ax - bx) < ahx + bhx &&
    Math.abs(ay - by) < ahy + bhy &&
    Math.abs(az - bz) < ahz + bhz
  )
}

export class Game {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private player: THREE.Mesh
  private shadow: THREE.Mesh
  private bodies: Body[] = []
  private input = new Input()
  private asmr = new Asmr()
  private last = performance.now()
  private elapsed = 0
  private running = false
  private won = false
  private px = 0
  private py = 1.4
  private pz = 0
  private vx = 0
  private vy = 0
  private vz = 0
  private onGround = false
  private coyote = 0
  private buffer = 0
  private spawn = { x: 0, y: 1.6, z: 0 }
  private deaths = 0
  private bits = 0
  private bitTotal = 0
  private checkIndex = 0
  private checkTotal = 0
  private squish = 1
  private cam = new THREE.Vector3(0, 7, -11)
  private look = new THREE.Vector3()
  private stand: Body | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.08

    this.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 220)
    this.scene.background = new THREE.Color(0xd8c6ff)
    this.scene.fog = new THREE.Fog(0xd8c6ff, 28, 92)

    const hemi = new THREE.HemisphereLight(0xffd0ea, 0x8ec8ff, 1.15)
    this.scene.add(hemi)
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.35)
    sun.position.set(-12, 22, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.near = 2
    sun.shadow.camera.far = 70
    sun.shadow.camera.left = -30
    sun.shadow.camera.right = 30
    sun.shadow.camera.top = 30
    sun.shadow.camera.bottom = -30
    this.scene.add(sun)

    const geo = new RoundedBoxGeometry(0.9, 0.9, 0.9, 3, 0.14)
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xff74b8,
      roughness: 0.32,
      metalness: 0.05,
      clearcoat: 0.35,
      clearcoatRoughness: 0.28,
    })
    this.player = new THREE.Mesh(geo, mat)
    this.player.castShadow = true
    this.scene.add(this.player)
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x6ec4ff }),
    )
    this.player.add(edge)

    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x4a2a60,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), shadowMat)
    this.shadow.rotation.x = -Math.PI / 2
    this.scene.add(this.shadow)

    this.buildWorld()
    this.input.attach()
    window.addEventListener('resize', this.resize)
    this.resize()
    requestAnimationFrame(() => {
      this.resize()
      this.loop()
    })
  }

  async begin() {
    await this.asmr.unlock()
    this.running = true
  }

  restart() {
    this.won = false
    this.deaths = 0
    this.bits = 0
    this.checkIndex = 0
    this.spawn = { x: 0, y: 1.6, z: 0 }
    for (const body of this.bodies) this.resetBody(body, true)
    this.place(this.spawn.x, this.spawn.y, this.spawn.z)
    this.hud()
    document.getElementById('win')?.classList.add('hidden')
    this.running = true
  }

  private buildWorld() {
    const course = buildCourse()
    for (const spec of course) {
      if (spec.kind === 'check') this.checkTotal += 1
      if (spec.kind === 'bit') this.bitTotal += 1
      const geo = new RoundedBoxGeometry(spec.sx, spec.sy, spec.sz, 2, 0.1)
      const mat = new THREE.MeshPhysicalMaterial({
        color: spec.color,
        roughness: spec.kind === 'hazard' ? 0.18 : 0.42,
        metalness: spec.kind === 'goal' ? 0.35 : 0.04,
        clearcoat: 0.45,
        emissive: spec.kind === 'check' || spec.kind === 'goal' ? spec.color : 0x000000,
        emissiveIntensity: spec.kind === 'check' || spec.kind === 'goal' ? 0.18 : 0,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(spec.x, spec.y, spec.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      this.bodies.push({
        spec,
        mesh,
        baseX: spec.x,
        baseY: spec.y,
        baseZ: spec.z,
        x: spec.x,
        y: spec.y,
        z: spec.z,
        prevX: spec.x,
        prevY: spec.y,
        prevZ: spec.z,
        armed: 0,
        falling: false,
        gone: 0,
        taken: false,
      })
    }
  }

  private loop = () => {
    requestAnimationFrame(this.loop)
    const now = performance.now()
    const dt = Math.min(0.033, (now - this.last) / 1000)
    this.last = now
    this.elapsed += dt
    this.movePlatforms(dt)
    if (this.running && !this.won) this.update(dt)
    this.asmr.tick(dt)
    this.draw(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.input.sample()

    if (this.input.consumeJump()) this.buffer = BUFFER
    this.buffer = Math.max(0, this.buffer - dt)
    this.coyote = this.onGround ? COYOTE : Math.max(0, this.coyote - dt)

    const accel = this.onGround ? GROUND_ACCEL : AIR
    this.vx += this.input.x * accel * dt
    this.vz += this.input.z * accel * dt
    const speed = Math.hypot(this.vx, this.vz)
    const cap = SPEED
    if (speed > cap) {
      this.vx = (this.vx / speed) * cap
      this.vz = (this.vz / speed) * cap
    }
    if (this.onGround) {
      this.vx *= Math.exp(-FRICTION * dt)
      this.vz *= Math.exp(-FRICTION * dt)
    }

    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = JUMP
      this.onGround = false
      this.coyote = 0
      this.buffer = 0
      this.squish = 1.22
      this.asmr.jump()
    }

    this.vy += GRAVITY * dt
    this.vy = Math.max(this.vy, -36)

    const wasGround = this.onGround
    this.forgetStand()

    this.px += this.vx * dt
    this.resolve('x')
    this.pz += this.vz * dt
    this.resolve('z')
    this.py += this.vy * dt
    this.resolve('y')

    const ride = this.stand
    if (ride && this.onGround) {
      this.px += ride.x - ride.prevX
      this.py += ride.y - ride.prevY
      this.pz += ride.z - ride.prevZ
    }

    if (this.onGround && !wasGround && this.vy <= 0.1) {
      this.squish = 0.72
      this.asmr.land()
    }

    this.triggers()
    if (this.py < -10) this.die()
    this.hud()
  }

  private movePlatforms(dt: number) {
    const t = this.elapsed
    for (const body of this.bodies) {
      if (body.taken) continue
      body.prevX = body.x
      body.prevY = body.y
      body.prevZ = body.z
      const { spec } = body
      if (spec.kind === 'moveX') {
        body.x = body.baseX + Math.sin(t * (spec.speed ?? 1) + (spec.phase ?? 0)) * (spec.amp ?? 2)
      } else if (spec.kind === 'moveZ') {
        body.z = body.baseZ + Math.sin(t * (spec.speed ?? 1) + (spec.phase ?? 0)) * (spec.amp ?? 2)
      } else if (spec.kind === 'moveY') {
        body.y = body.baseY + Math.sin(t * (spec.speed ?? 1) + (spec.phase ?? 0)) * (spec.amp ?? 1.2)
      } else if (spec.kind === 'fall') {
        if (this.stand === body && this.onGround) body.armed += dt
        if (body.armed > 0.28) body.falling = true
        if (body.falling) {
          body.y -= 11 * dt
          body.gone += dt
          if (body.gone > 2.4) this.resetBody(body)
        }
      } else if (spec.kind === 'bit') {
        body.y = body.baseY + Math.sin(t * 3 + body.baseZ) * 0.18
        body.mesh.rotation.y += dt * 1.6
      }
      body.mesh.position.set(body.x, body.y, body.z)
    }
  }

  private forgetStand() {
    this.onGround = false
    this.stand = null
  }

  private resolve(axis: 'x' | 'y' | 'z') {
    for (const body of this.bodies) {
      if (body.taken) continue
      const kind = body.spec.kind
      if (kind === 'bit' || kind === 'hazard') continue
      const hx = body.spec.sx / 2
      const hy = body.spec.sy / 2
      const hz = body.spec.sz / 2
      if (!overlap(this.px, this.py, this.pz, HALF, HALF, HALF, body.x, body.y, body.z, hx, hy, hz)) continue

      if (axis === 'x') {
        this.px = this.px < body.x ? body.x - hx - HALF - 0.001 : body.x + hx + HALF + 0.001
        this.vx = 0
      } else if (axis === 'z') {
        this.pz = this.pz < body.z ? body.z - hz - HALF - 0.001 : body.z + hz + HALF + 0.001
        this.vz = 0
      } else {
        const fromAbove = this.py >= body.y
        if (fromAbove) {
          this.py = body.y + hy + HALF
          if (this.vy <= 0) {
            this.vy = kind === 'bounce' ? BOUNCE : 0
            this.onGround = kind !== 'bounce'
            this.stand = body
            if (kind === 'bounce' && this.vy > 0) this.asmr.jump()
          }
        } else {
          this.py = body.y - hy - HALF - 0.001
          this.vy = Math.min(this.vy, 0)
        }
      }
    }
  }

  private triggers() {
    for (const body of this.bodies) {
      if (body.taken) continue
      const hx = body.spec.sx / 2
      const hy = body.spec.sy / 2
      const hz = body.spec.sz / 2
      if (!overlap(this.px, this.py, this.pz, HALF, HALF, HALF, body.x, body.y, body.z, hx, hy, hz)) continue
      if (body.spec.kind === 'hazard') {
        this.die()
        return
      }
      if (body.spec.kind === 'check') {
        const next = { x: body.x, y: body.y + hy + HALF + 0.15, z: body.z }
        if (next.z > this.spawn.z + 0.5) {
          this.spawn = next
          this.checkIndex += 1
          this.asmr.checkpoint()
        }
      }
      if (body.spec.kind === 'bit') {
        body.taken = true
        body.mesh.visible = false
        this.bits += 1
        this.asmr.collect()
      }
      if (body.spec.kind === 'goal') this.finish()
    }
  }

  private die() {
    this.deaths += 1
    this.asmr.fall()
    this.place(this.spawn.x, this.spawn.y, this.spawn.z)
    this.squish = 1.15
    for (const body of this.bodies) {
      if (body.spec.kind === 'fall') this.resetBody(body)
    }
  }

  private finish() {
    if (this.won) return
    this.won = true
    this.running = false
    this.asmr.win()
    const panel = document.getElementById('win')
    const stats = document.getElementById('win-stats')
    if (stats) {
      stats.textContent = `${this.deaths} falls · ${this.bits}/${this.bitTotal} bits · still the same cube`
    }
    panel?.classList.remove('hidden')
  }

  private place(x: number, y: number, z: number) {
    this.px = x
    this.py = y
    this.pz = z
    this.vx = 0
    this.vy = 0
    this.vz = 0
  }

  private resetBody(body: Body, restoreBits = false) {
    body.x = body.baseX
    body.y = body.baseY
    body.z = body.baseZ
    body.armed = 0
    body.falling = false
    body.gone = 0
    if (body.spec.kind !== 'bit' || restoreBits) {
      body.taken = false
      body.mesh.visible = true
    }
    body.mesh.position.set(body.x, body.y, body.z)
  }

  private draw(dt: number) {
    this.squish += (1 - this.squish) * Math.min(1, dt * 8)
    this.player.scale.set(2 - this.squish, this.squish, 2 - this.squish)
    this.player.position.set(this.px, this.py, this.pz)
    this.player.rotation.z = THREE.MathUtils.damp(this.player.rotation.z, -this.vx * 0.05, 8, dt)
    this.player.rotation.x = THREE.MathUtils.damp(this.player.rotation.x, this.vz * 0.04, 8, dt)

    this.shadow.position.set(this.px, Math.max(this.py - 0.46, -8), this.pz)

    const desired = new THREE.Vector3(this.px, this.py + 6.2, this.pz - 12)
    this.cam.lerp(desired, 1 - Math.exp(-3.2 * dt))
    this.look.lerp(new THREE.Vector3(this.px, this.py + 0.4, this.pz + 3), 1 - Math.exp(-4 * dt))
    this.camera.position.copy(this.cam)
    this.camera.lookAt(this.look)
  }

  private hud() {
    const checks = document.getElementById('checks')
    const deaths = document.getElementById('deaths')
    const bits = document.getElementById('bits')
    const bar = document.getElementById('progress')
    if (checks) checks.textContent = `Saves ${this.checkIndex}/${Math.max(this.checkTotal - 1, 1)}`
    if (deaths) deaths.textContent = `Falls ${this.deaths}`
    if (bits) bits.textContent = `Bits ${this.bits}/${this.bitTotal}`
    if (bar) {
      const span = Math.max(1, 270)
      bar.style.width = `${Math.min(100, (this.pz / span) * 100)}%`
    }
  }

  private resize = () => {
    const width = Math.max(1, innerWidth)
    const height = Math.max(1, innerHeight)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    const view = this.renderer.domElement
    view.style.width = '100%'
    view.style.height = '100%'
  }
}
