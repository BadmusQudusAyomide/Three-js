const { chromium } = require('playwright-core')

const EXEC_PATH = 'C:\\Users\\HP\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe'
const OUT = 'C:\\Users\\HP\\AppData\\Local\\Temp\\claude\\c--Users-HP-Documents-3-js\\14c5f299-40e3-46a4-8481-d99a0d63a527\\scratchpad'

async function main() {
  const browser = await chromium.launch({ executablePath: EXEC_PATH, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  await page.goto('http://localhost:5183/', { waitUntil: 'load' })
  await page.waitForTimeout(1200)

  await page.evaluate(() => {
    window.__debug.arrivalControls.enabled = false
    window.__debug.arrivalControls.update = () => {}
  })

  await page.evaluate(() => {
    window.__debug.camera.position.set(2.2, 0.9, -6.0)
    window.__debug.camera.rotation.set(0, Math.PI * 0.65, 0)
  })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/atmo-fireplace-close.png` })

  await page.evaluate(() => {
    window.__debug.camera.position.set(0, 3.6, -2.0)
    window.__debug.camera.rotation.set(-1.4, 0.001, 0)
  })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/atmo-fan-close.png` })

  await page.evaluate(() => {
    window.__debug.camera.position.set(0, 1.9, -1.35)
    window.__debug.camera.rotation.set(0, -Math.PI / 2, 0)
  })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/atmo-clock-close.png` })

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
