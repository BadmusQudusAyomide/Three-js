const { chromium } = require('playwright-core')

const EXEC_PATH = 'C:\\Users\\HP\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe'

async function main() {
  const browser = await chromium.launch({ executablePath: EXEC_PATH, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.on('pageerror', (err) => console.log('[pageerror]', err.message))

  await page.goto('http://localhost:5183/', { waitUntil: 'load' })
  await page.waitForTimeout(1500)

  const before = await page.evaluate(() => {
    const cam = window.__debug.camera
    return { camPos: cam.position.toArray() }
  })
  console.log('camera at load:', before.camPos)

  // sample the actual system clock and compare to what the wall-clock code
  // should compute, by reaching into the scene graph for the hour/minute
  // hand rotations after letting a couple of frames run
  await page.waitForTimeout(500)
  const check = await page.evaluate(() => {
    const now = new Date()
    return { hours: now.getHours(), minutes: now.getMinutes() }
  })
  console.log('system time at check:', check)

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
