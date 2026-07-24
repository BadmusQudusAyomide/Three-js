const { chromium } = require('playwright-core')

const EXEC_PATH = 'C:\\Users\\HP\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe'
const OUT = 'C:\\Users\\HP\\AppData\\Local\\Temp\\claude\\c--Users-HP-Documents-3-js\\14c5f299-40e3-46a4-8481-d99a0d63a527\\scratchpad'

async function main() {
  const browser = await chromium.launch({ executablePath: EXEC_PATH, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('pageerror', (err) => console.log('[pageerror]', err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[console error]', msg.text())
  })

  await page.goto('http://localhost:5183/', { waitUntil: 'load' })
  await page.waitForTimeout(1200)

  await page.evaluate(() => {
    window.__debug.arrivalControls.enabled = false
    window.__debug.arrivalControls.update = () => {}
  })

  async function shoot(name, x, y, z, yaw) {
    await page.evaluate(
      ({ x, y, z, yaw }) => {
        window.__debug.camera.position.set(x, y, z)
        window.__debug.camera.rotation.set(0, yaw, 0)
      },
      { x, y, z, yaw },
    )
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/atmo-${name}.png` })
  }

  // wide view of the room from near the door
  await shoot('overview', 0, 1.75, -1.5, 0)
  // toward the fireplace on the right wall
  await shoot('fireplace', 1.5, 1.6, -4.5, Math.PI * 1.15)
  // toward the bookshelf / plant on the left wall
  await shoot('bookshelf-plant', -1.5, 1.6, -5.5, -Math.PI / 2)
  // looking up at the ceiling fan
  await shoot('ceiling-fan', 0, 1.75, -1.5, 0.001)
  // close on the wall clock
  await shoot('clock', 0, 1.9, -1.4, Math.PI)
  // rug close-up
  await shoot('rug', 0, 2.5, -3.6, -Math.PI / 2 - 0.001)

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
