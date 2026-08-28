import './style.css'
import { Game } from './game'

const canvas = document.querySelector<HTMLCanvasElement>('#view')
const veil = document.getElementById('veil')
const lede = veil?.querySelector('.lede')

function fail(message: string) {
  if (lede) lede.textContent = message
  veil?.classList.remove('hidden')
}

try {
  if (!canvas) throw new Error('Missing canvas')
  const game = new Game(canvas)

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
} catch (error) {
  console.error(error)
  fail('Could not start the 3D view. Open this page in Chrome or Edge, then refresh.')
}
