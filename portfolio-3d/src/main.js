import './style.css'
import * as THREE from 'three'

import { createMaterials } from './scene/materials.js'
import { createSky, createLights } from './scene/sky.js'
import { createGround } from './scene/ground.js'
import { createHouse, isHouseBlocking } from './scene/house.js'
import { createGate } from './scene/gate.js'
import { createVegetation } from './scene/vegetation.js'
import { createNameSign } from './scene/nameSign.js'
import { createFireflies } from './scene/fireflies.js'
import { createArrivalControls } from './controls/arrivalView.js'
import { createWalkControls } from './controls/walk.js'

document.body.innerHTML = `
  <div id="loading">Arriving…</div>
  <div id="hero-text">
    <h1>Badmus Ayomide</h1>
    <p>Welcome home u can look around</p>
  </div>
  <button id="walk-btn">Walk around</button>
  <div id="walk-hint">WASD to move · mouse to look · Esc to stop</div>
`

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
)
camera.position.set(0, 1.75, 9.5)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.95
document.body.appendChild(renderer.domElement)

const { sunPosition } = createSky(scene)
const { porchLight } = createLights(scene, sunPosition)

const materials = createMaterials()
createGround(scene, materials)
const { door } = createHouse(scene, materials)
createGate(scene, materials)
createVegetation(scene, materials)
const nameSign = createNameSign(scene)
const fireflies = createFireflies(scene)

const arrivalControls = createArrivalControls(camera, renderer.domElement)

const walk = createWalkControls({
  camera,
  renderer,
  arrivalControls,
  isBlocking: isHouseBlocking,
  yardBounds: { minX: -10, maxX: 10, minZ: -8.5, maxZ: 10.5 },
  ui: {
    walkBtn: document.getElementById('walk-btn'),
    walkHint: document.getElementById('walk-hint'),
    heroText: document.getElementById('hero-text'),
  },
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

const loadingEl = document.getElementById('loading')
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    loadingEl.style.opacity = '0'
    setTimeout(() => loadingEl.remove(), 700)
  })
})

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.1)
  const t = clock.elapsedTime

  walk.update(dt)
  fireflies.update(t)
  nameSign.update(t)
  door.update(camera.position, dt)

  porchLight.intensity = 6 + Math.sin(t * 3) * 0.3

  if (!walk.isLocked) arrivalControls.update()
  renderer.render(scene, camera)
}

animate()
