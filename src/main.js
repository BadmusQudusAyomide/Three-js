import './style.css'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

// --- basic setup ---
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x8fc7ff)
scene.fog = new THREE.Fog(0x8fc7ff, 40, 220)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 1.7, 15)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

// --- bloom post-processing (makes lights actually glow) ---
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.25, // strength: subtle, just a bit of sun glow
  0.4, // radius
  0.9 // threshold: only the sun itself is bright enough to bloom
)
composer.addPass(bloomPass)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
})

// --- lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 1.0))

const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.2)
sunLight.position.set(60, 90, 30)
scene.add(sunLight)

// --- sun disc, visible in the sky ---
const sunDisc = new THREE.Mesh(
  new THREE.SphereGeometry(6, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xfff8e0 })
)
sunDisc.position.copy(sunLight.position).setLength(220)
scene.add(sunDisc)

// --- ground ---
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0xa8a8a0, roughness: 1 })
)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

// --- city: grid of buildings, some cells skipped for streets ---
const gridSize = 20 // 20x20 city blocks
const cellSize = 6
const streetEvery = 4 // every 4th row/col is a street, left empty

// generate a glass-window grid texture on the fly (subtle grid lines, no glow)
function makeWindowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#dce6f0'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const cols = 6
  const rows = 12
  const cellW = canvas.width / cols
  const cellH = canvas.height / rows

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shade = 0.75 + Math.random() * 0.2
      ctx.fillStyle = `rgba(${120 * shade}, ${150 * shade}, ${180 * shade}, 1)`
      ctx.fillRect(
        c * cellW + cellW * 0.1,
        r * cellH + cellH * 0.1,
        cellW * 0.8,
        cellH * 0.8
      )
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 4)
  return texture
}

const windowTexture = makeWindowTexture()

const buildingGeo = new THREE.BoxGeometry(1, 1, 1)
const buildingMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  map: windowTexture,
  roughness: 0.4,
  metalness: 0.1,
})

const maxBuildings = gridSize * gridSize
const buildings = new THREE.InstancedMesh(buildingGeo, buildingMat, maxBuildings)
buildings.instanceColor = new THREE.InstancedBufferAttribute(
  new Float32Array(maxBuildings * 3),
  3
)

const dummy = new THREE.Object3D()
const windowColor = new THREE.Color()
let instanceIndex = 0

for (let gx = 0; gx < gridSize; gx++) {
  for (let gz = 0; gz < gridSize; gz++) {
    const isStreet = gx % streetEvery === 0 || gz % streetEvery === 0
    if (isStreet) continue

    const worldX = (gx - gridSize / 2) * cellSize + (Math.random() - 0.5) * 1.5
    const worldZ = (gz - gridSize / 2) * cellSize + (Math.random() - 0.5) * 1.5

    const width = 2 + Math.random() * 2
    const depth = 2 + Math.random() * 2
    const height = 3 + Math.random() * Math.random() * 40 // mostly short, occasional towers

    dummy.position.set(worldX, height / 2, worldZ)
    dummy.scale.set(width, height, depth)
    dummy.updateMatrix()
    buildings.setMatrixAt(instanceIndex, dummy.matrix)

    // subtle color variation between buildings
    const shade = 0.75 + Math.random() * 0.25
    windowColor.setRGB(shade, shade, shade)
    buildings.setColorAt(instanceIndex, windowColor)

    instanceIndex++
  }
}

buildings.count = instanceIndex
scene.add(buildings)

// --- first-person controls (click canvas to lock pointer) ---
const controls = new PointerLockControls(camera, renderer.domElement)
renderer.domElement.addEventListener('click', () => controls.lock())

const move = { forward: false, back: false, left: false, right: false }

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') move.forward = true
  if (e.code === 'KeyS') move.back = true
  if (e.code === 'KeyA') move.left = true
  if (e.code === 'KeyD') move.right = true
})
document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') move.forward = false
  if (e.code === 'KeyS') move.back = false
  if (e.code === 'KeyA') move.left = false
  if (e.code === 'KeyD') move.right = false
})

const walkSpeed = 12
const clock = new THREE.Clock()











// --- render loop ---
function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()
  const speed = walkSpeed * delta

  if (controls.isLocked) {
    if (move.forward) controls.moveForward(speed)
    if (move.back) controls.moveForward(-speed)
    if (move.right) controls.moveRight(speed)
    if (move.left) controls.moveRight(-speed)
  }

  composer.render()
}

animate()
