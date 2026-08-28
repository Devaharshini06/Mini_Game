import './style.css'
import { Game } from './game'
import { LEVEL_MAX } from './level'

const COLORS = [
  { hex: 0xff74b8, label: 'Pink' },
  { hex: 0x7ecbff, label: 'Blue' },
  { hex: 0xc9a8ff, label: 'Lilac' },
  { hex: 0xffb4d8, label: 'Blush' },
  { hex: 0x8ef0d2, label: 'Mint' },
  { hex: 0xffe08a, label: 'Gold' },
]

const canvas = document.querySelector<HTMLCanvasElement>('#view')
const veil = document.getElementById('veil')
const lede = veil?.querySelector('.lede')

function fail(message: string) {
  if (lede) lede.textContent = message
  veil?.classList.remove('hidden')
}

function paintSwatches(game: Game) {
  const roots = document.querySelectorAll<HTMLElement>('.swatches')
  for (const root of roots) {
    root.innerHTML = ''
    for (const tone of COLORS) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'swatch'
      btn.style.background = `#${tone.hex.toString(16).padStart(6, '0')}`
      btn.setAttribute('aria-label', tone.label)
      btn.dataset.hex = String(tone.hex)
      if (tone.hex === game.cubeTint()) btn.classList.add('on')
      btn.addEventListener('click', (event) => {
        event.stopPropagation()
        game.setCubeColor(tone.hex)
        document.querySelectorAll('.swatch').forEach((item) => {
          item.classList.toggle('on', (item as HTMLElement).dataset.hex === String(tone.hex))
        })
      })
      root.append(btn)
    }
  }
}

function syncLevel(game: Game) {
  const label = document.getElementById('level-label')
  if (label) label.textContent = `Level ${game.currentLevel()} / ${LEVEL_MAX}`
}

try {
  if (!canvas) throw new Error('Missing canvas')
  const game = new Game(canvas)
  paintSwatches(game)
  syncLevel(game)

  document.getElementById('begin')?.addEventListener('click', async () => {
    try {
      document.getElementById('veil')?.classList.add('hidden')
      await game.begin()
    } catch {
      fail('Tap Begin again to allow sound, or refresh the page.')
    }
  })

  document.getElementById('again')?.addEventListener('click', () => {
    game.restart()
  })

  document.getElementById('next')?.addEventListener('click', () => {
    game.nextLevel()
    syncLevel(game)
  })

  document.getElementById('level-prev')?.addEventListener('click', () => {
    game.setLevel(game.currentLevel() - 1)
    syncLevel(game)
  })

  document.getElementById('level-next')?.addEventListener('click', () => {
    game.setLevel(game.currentLevel() + 1)
    syncLevel(game)
  })
} catch (error) {
  console.error(error)
  fail('Could not start the 3D view. Open this page in Chrome or Edge, then refresh.')
}
