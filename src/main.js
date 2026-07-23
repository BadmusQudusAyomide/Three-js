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

// --- roads: asphalt strips with dashed lane markings along each street line ---
const roadWidth = cellSize * 0.8
const citySpan = gridSize * cellSize

// dashes stacked along canvas height (V axis) -> used for roads running along Z
function makeRoadTextureVertical(repeatCount) {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#33343a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#e3e2db'
  ctx.fillRect(canvas.width / 2 - 2, canvas.height * 0.15, 4, canvas.height * 0.4)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, repeatCount)
  return texture
}

// dashes stacked along canvas width (U axis) -> used for roads running along X
function makeRoadTextureHorizontal(repeatCount) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#020202'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#f2f1ecec'
  ctx.fillRect(canvas.width * 0.15, canvas.height / 2 - 2, canvas.width * 0.4, 4)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatCount, 1)
  return texture
}

const dashRepeats = Math.round(citySpan / (cellSize * 0.5))
const roadMatZ = new THREE.MeshStandardMaterial({
  map: makeRoadTextureVertical(dashRepeats),
  roughness: 1,
})
const roadMatX = new THREE.MeshStandardMaterial({
  map: makeRoadTextureHorizontal(dashRepeats),
  roughness: 1,
})

for (let i = 0; i < gridSize; i++) {
  if (i % streetEvery !== 0) continue
  const linePos = (i - gridSize / 2) * cellSize

  // road running along Z (fixed X)
  const roadZ = new THREE.Mesh(
    new THREE.PlaneGeometry(roadWidth, citySpan),
    roadMatZ
  )
  roadZ.rotation.x = -Math.PI / 2
  roadZ.position.set(linePos, 0.02, 0)
  scene.add(roadZ)

  // road running along X (fixed Z)
  const roadX = new THREE.Mesh(
    new THREE.PlaneGeometry(citySpan, roadWidth),
    roadMatX
  )
  roadX.rotation.x = -Math.PI / 2
  roadX.position.set(0, 0.02, linePos)
  scene.add(roadX)
}

// generate a facade texture for an individual building
function makeFacadeTexture(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#c4cad1'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const cols = 4 + Math.floor(Math.random() * 3)
  const rows = 8 + Math.floor(Math.random() * 5)
  const cellW = canvas.width / cols
  const cellH = canvas.height / rows

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shade = 0.7 + Math.random() * 0.3
      ctx.fillStyle = `rgba(${120 * shade}, ${130 * shade}, ${160 * shade}, 1)`
      ctx.fillRect(
        c * cellW + cellW * 0.08,
        r * cellH + cellH * 0.08,
        cellW * 0.84,
        cellH * 0.84
      )
      if (Math.random() < 0.18) {
        ctx.fillStyle = 'rgba(255, 235, 180, 0.7)'
        ctx.fillRect(
          c * cellW + cellW * 0.22,
          r * cellH + cellH * 0.22,
          cellW * 0.56,
          cellH * 0.56
        )
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(Math.max(1, width * 0.5), Math.max(1, height * 0.25))
  return texture
}

function makeBuildingMaterial(width, height) {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.57 + Math.random() * 0.08, 0.08, 0.72),
    map: makeFacadeTexture(width, height),
    roughness: 0.45,
    metalness: 0.12,
    emissive: 0x111111,
    emissiveIntensity: 0.12,
  })
  return material
}

const buildingGeo = new THREE.BoxGeometry(1, 1, 1)
const buildings = new THREE.Group()

for (let gx = 0; gx < gridSize; gx++) {
  for (let gz = 0; gz < gridSize; gz++) {
    const isStreet = gx % streetEvery === 0 || gz % streetEvery === 0
    if (isStreet) continue

    const worldX = (gx - gridSize / 2) * cellSize + (Math.random() - 0.5) * 1.5
    const worldZ = (gz - gridSize / 2) * cellSize + (Math.random() - 0.5) * 1.5

    const width = 2 + Math.random() * 2
    const depth = 2 + Math.random() * 2
    const height = 4 + Math.pow(Math.random(), 2) * 36

    const mesh = new THREE.Mesh(buildingGeo, makeBuildingMaterial(width, height))
    mesh.position.set(worldX, height / 2, worldZ)
    mesh.scale.set(width, height, depth)
    mesh.castShadow = true
    mesh.receiveShadow = true
    buildings.add(mesh)
  }
}
scene.add(buildings)

const buildingBoxes = []
const boxHelper = new THREE.Box3()
const cameraColliderRadius = 0.45
const cameraCollider = new THREE.Sphere(new THREE.Vector3(), cameraColliderRadius)

for (const building of buildings.children) {
  boxHelper.setFromObject(building)
  buildingBoxes.push(boxHelper.clone())
}

function isColliding(position) {
  cameraCollider.center.copy(position)
  return buildingBoxes.some((box) => box.distanceToPoint(position) < cameraColliderRadius)
}

function tryMoveCamera(deltaX, deltaZ) {
  const nextPos = camera.position.clone().add(new THREE.Vector3(deltaX, 0, deltaZ))
  if (!isColliding(nextPos)) {
    camera.position.copy(nextPos)
  }
}

// add sidewalks and curbs along the city roads
const sidewalkWidth = 1.2
const sidewalkMat = new THREE.MeshStandardMaterial({
  color: 0xb6b6a9,
  roughness: 1,
  metalness: 0,
})
const curbMat = new THREE.MeshStandardMaterial({
  color: 0x7a7a73,
  roughness: 1,
  metalness: 0,
})

for (let i = 0; i < gridSize; i++) {
  if (i % streetEvery !== 0) continue
  const linePos = (i - gridSize / 2) * cellSize

  const sidewalkZ1 = new THREE.Mesh(
    new THREE.PlaneGeometry(sidewalkWidth, citySpan + sidewalkWidth * 2),
    sidewalkMat
  )
  sidewalkZ1.rotation.x = -Math.PI / 2
  sidewalkZ1.position.set(linePos - roadWidth / 2 - sidewalkWidth / 2, 0.025, 0)
  scene.add(sidewalkZ1)

  const sidewalkZ2 = new THREE.Mesh(
    new THREE.PlaneGeometry(sidewalkWidth, citySpan + sidewalkWidth * 2),
    sidewalkMat
  )
  sidewalkZ2.rotation.x = -Math.PI / 2
  sidewalkZ2.position.set(linePos + roadWidth / 2 + sidewalkWidth / 2, 0.025, 0)
  scene.add(sidewalkZ2)

  const sidewalkX1 = new THREE.Mesh(
    new THREE.PlaneGeometry(citySpan + sidewalkWidth * 2, sidewalkWidth),
    sidewalkMat
  )
  sidewalkX1.rotation.x = -Math.PI / 2
  sidewalkX1.position.set(0, 0.025, linePos - roadWidth / 2 - sidewalkWidth / 2)
  scene.add(sidewalkX1)

  const sidewalkX2 = new THREE.Mesh(
    new THREE.PlaneGeometry(citySpan + sidewalkWidth * 2, sidewalkWidth),
    sidewalkMat
  )
  sidewalkX2.rotation.x = -Math.PI / 2
  sidewalkX2.position.set(0, 0.025, linePos + roadWidth / 2 + sidewalkWidth / 2)
  scene.add(sidewalkX2)

  const curbZ1 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, citySpan + sidewalkWidth * 2), curbMat)
  curbZ1.rotation.x = -Math.PI / 2
  curbZ1.position.set(linePos - roadWidth / 2, 0.03, 0)
  scene.add(curbZ1)

  const curbZ2 = new THREE.Mesh(new THREE.PlaneGeometry(0.08, citySpan + sidewalkWidth * 2), curbMat)
  curbZ2.rotation.x = -Math.PI / 2
  curbZ2.position.set(linePos + roadWidth / 2, 0.03, 0)
  scene.add(curbZ2)

  const curbX1 = new THREE.Mesh(new THREE.PlaneGeometry(citySpan + sidewalkWidth * 2, 0.08), curbMat)
  curbX1.rotation.x = -Math.PI / 2
  curbX1.position.set(0, 0.03, linePos - roadWidth / 2)
  scene.add(curbX1)

  const curbX2 = new THREE.Mesh(new THREE.PlaneGeometry(citySpan + sidewalkWidth * 2, 0.08), curbMat)
  curbX2.rotation.x = -Math.PI / 2
  curbX2.position.set(0, 0.03, linePos + roadWidth / 2)
  scene.add(curbX2)
}

// --- first-person controls (click canvas to lock pointer) ---
const controls = new PointerLockControls(camera, renderer.domElement)

const info = document.createElement('div')
info.style.position = 'absolute'
info.style.top = '16px'
info.style.left = '16px'
info.style.padding = '12px 16px'
info.style.background = 'rgba(0, 0, 0, 0.65)'
info.style.color = '#ffffff'
info.style.fontFamily = 'sans-serif'
info.style.fontSize = '14px'
info.style.borderRadius = '10px'
info.style.zIndex = '10'
info.style.maxWidth = '280px'
info.innerText = 'Click to enter the street. Use W/A/S/D or arrow keys to move, mouse to look around.'
document.body.appendChild(info)

renderer.domElement.style.cursor = 'pointer'
renderer.domElement.addEventListener('click', () => controls.lock())

controls.addEventListener('lock', () => {
  info.style.display = 'none'
})
controls.addEventListener('unlock', () => {
  info.style.display = 'block'
})

const move = { forward: false, back: false, left: false, right: false }

function handleKey(e, pressed) {
  if (e.code === 'KeyW' || e.code === 'ArrowUp') move.forward = pressed
  if (e.code === 'KeyS' || e.code === 'ArrowDown') move.back = pressed
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') move.left = pressed
  if (e.code === 'KeyD' || e.code === 'ArrowRight') move.right = pressed
}

document.addEventListener('keydown', (e) => handleKey(e, true))
document.addEventListener('keyup', (e) => handleKey(e, false))

const walkSpeed = 12
const clock = new THREE.Clock()











// --- render loop ---
function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()
  const speed = walkSpeed * delta

  if (controls.isLocked) {
    const localMove = new THREE.Vector3()
    if (move.forward) localMove.z -= 1
    if (move.back) localMove.z += 1
    if (move.left) localMove.x -= 1
    if (move.right) localMove.x += 1

    if (localMove.lengthSq() > 0) {
      localMove.normalize()
      localMove.applyQuaternion(camera.quaternion)
      localMove.y = 0
      localMove.multiplyScalar(speed)

      tryMoveCamera(localMove.x, 0)
      tryMoveCamera(0, localMove.z)
    }
  }

  composer.render()
}

animate()
