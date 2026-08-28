export class Asmr {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private dropTimer = 0

  async unlock() {
    if (this.ctx) {
      await this.ctx.resume()
      return
    }
    const ctx = new AudioContext()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0.22
    this.master.connect(ctx.destination)
    this.noise = this.makeNoise(2)
    this.startRain()
  }

  jump() {
    this.whoosh(680, 0.09, 0.08)
  }

  land() {
    this.tap(168, 0.12)
    this.whoosh(240, 0.05, 0.05)
  }

  checkpoint() {
    this.chime(523, 0.28)
    this.chime(784, 0.34, 0.05)
  }

  collect() {
    this.chime(1174, 0.16)
  }

  fall() {
    this.whoosh(140, 0.35, 0.12)
  }

  win() {
    this.chime(523, 0.4)
    this.chime(659, 0.45, 0.08)
    this.chime(784, 0.5, 0.16)
  }

  tick(dt: number) {
    this.dropTimer -= dt
    if (this.dropTimer <= 0) {
      this.dropTimer = 2.8 + Math.random() * 5
      this.drip()
    }
  }

  private startRain() {
    if (!this.ctx || !this.master || !this.noise) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = true
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 620
    filter.Q.value = 0.5
    const air = this.ctx.createBiquadFilter()
    air.type = 'highpass'
    air.frequency.value = 180
    const gain = this.ctx.createGain()
    gain.gain.value = 0.22
    src.connect(air)
    air.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start()
    this.lfo(filter.frequency, 420, 280, 0.07)
  }

  private tap(freq: number, dur: number) {
    if (!this.ctx || !this.master) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start()
    osc.stop(this.ctx.currentTime + dur + 0.02)
  }

  private whoosh(freq: number, dur: number, vol: number) {
    if (!this.ctx || !this.master || !this.noise) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noise
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = freq
    filter.Q.value = 1.4
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(vol, this.ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start()
    src.stop(this.ctx.currentTime + dur + 0.02)
  }

  private chime(freq: number, dur: number, delay = 0) {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.96, t + dur)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private drip() {
    this.chime(920 + Math.random() * 200, 0.5)
  }

  private lfo(param: AudioParam, base: number, depth: number, rate: number) {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.frequency.value = rate
    gain.gain.value = depth
    osc.connect(gain)
    gain.connect(param)
    param.value = base
    osc.start()
  }

  private makeNoise(seconds: number) {
    if (!this.ctx) throw new Error('audio locked')
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * seconds, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      last = 0.97 * last + 0.03 * white
      data[i] = last
    }
    return buffer
  }
}
