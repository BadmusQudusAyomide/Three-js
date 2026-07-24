const { chromium } = require('playwright-core')

const EXEC_PATH = 'C:\\Users\\HP\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe'
const OUT = 'C:\\Users\\HP\\AppData\\Local\\Temp\\claude\\c--Users-HP-Documents-3-js\\14c5f299-40e3-46a4-8481-d99a0d63a527\\scratchpad'

async function main() {
  const browser = await chromium.launch({ executablePath: EXEC_PATH, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('pageerror', (err) => console.log('[pageerror]', err.message))

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
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${OUT}/room-${name}.png` })
  }

  // standing just inside the doorway, looking into the new furnished room
  await shoot('entry-view', 0, 1.75, -1, 0)
  // deeper in, near the sofa/coffee table, looking at the TV wall
  await shoot('sofa-area', 0, 1.75, -2, 0)
  // near the bookshelf/plant side, wide look at the room
  await shoot('side-view', -2, 1.75, -4, Math.PI / 2)
  // whole exterior from a distance to check the bigger house silhouette
  await shoot('exterior', 0, 2.2, 14, 0)

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
