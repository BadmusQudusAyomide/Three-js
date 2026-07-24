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

  async function shoot(name, x, y, z, yaw, pitch = 0) {
    await page.evaluate(
      ({ x, y, z, yaw, pitch }) => {
        window.__debug.camera.position.set(x, y, z)
        window.__debug.camera.rotation.set(pitch, yaw, 0)
      },
      { x, y, z, yaw, pitch },
    )
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/atmo-${name}.png` })
  }

  // wide view of the room from near the door
  await shoot('overview', 0, 1.75, -1.5, 0)
  // toward the fireplace on the right wall (facing +x)
  await shoot('fireplace', 0, 1.4, -6.0, Math.PI / 2)
  // toward the bookshelf / plant on the left wall (facing -x)
  await shoot('bookshelf-plant', 0, 1.4, -6.0, -Math.PI / 2)
  // looking up at the ceiling fan
  await shoot('ceiling-fan', 0, 1.75, -2.0, 0.001, -0.9)
  // wall clock, standing near it facing +x
  await shoot('clock', 0, 1.75, -1.2, Math.PI / 2)
  // rug pattern, standing over it looking down-ish via position only
  await shoot('rug', 0, 1.75, -4.0, 0)

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
