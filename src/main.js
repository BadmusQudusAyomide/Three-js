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
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const baseHue = 210
  const baseLight = 0.52 + Math.random() * 0.14
  const topLight = Math.min(0.92, baseLight + 0.08)
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, `hsl(${baseHue}, 18%, ${Math.round(topLight * 100)}%)`)
  gradient.addColorStop(1, `hsl(${baseHue}, 12%, ${Math.round(baseLight * 100)}%)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // subtle vertical paneling and weathering
  for (let i = 0; i < 5; i++) {
    const x = i * canvas.width * 0.18 + (Math.random() - 0.5) * 10
    ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`
    ctx.fillRect(x, 0, 8, canvas.height)
  }

  const cols = 3 + Math.floor(Math.random() * 3)
  const rows = 10 + Math.floor(Math.random() * 6)
  const cellW = canvas.width / cols
  const cellH = canvas.height / rows

  const baseHeight = cellH * 1.1
  const baseY = canvas.height - baseHeight
  ctx.fillStyle = `rgba(30, 34, 38, 0.55)`
  ctx.fillRect(0, baseY, canvas.width, baseHeight)

  for (let i = 0; i < cols; i++) {
    if (Math.random() < 0.7) {
      const signWidth = cellW * 0.6
      const signHeight = baseHeight * 0.28
      const signX = i * cellW + (cellW - signWidth) * 0.5
      ctx.fillStyle = `rgba(210, 220, 240, ${0.4 + Math.random() * 0.25})`
      ctx.fillRect(signX, baseY + baseHeight * 0.15, signWidth, signHeight)
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + cellW * 0.08
      const y = r * cellH + cellH * 0.08
      const w = cellW * 0.84
      const h = cellH * 0.84

      const panelShade = 0.88 - Math.random() * 0.12
      ctx.fillStyle = `hsl(${baseHue}, 18%, ${Math.round(panelShade * 100)}%)`
      ctx.fillRect(x, y, w, h)

      const windowGlow = Math.random() < 0.5
      if (windowGlow) {
        ctx.fillStyle = `rgba(255, 235, 180, ${0.35 + Math.random() * 0.25})`
      } else {
        ctx.fillStyle = `rgba(45, 60, 90, ${0.35 + Math.random() * 0.25})`
      }
      ctx.fillRect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76)

      if (Math.random() < 0.3) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76)
      }

      // add a small balcony or detail in some panels
      if (Math.random() < 0.17) {
        const balconyY = y + h * 0.7
        ctx.fillStyle = 'rgba(40, 40, 45, 0.85)'
        ctx.fillRect(x + w * 0.1, balconyY, w * 0.8, h * 0.08)
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + w * 0.1, balconyY, w * 0.8, h * 0.08)
      }
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 2
  for (let c = 1; c < cols; c++) {
    const x = c * cellW
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  for (let r = 1; r < rows; r++) {
    const y = r * cellH
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }

  // noise overlay for extra realism
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(Math.max(1, width * 0.55), Math.max(1, height * 0.18))
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  return texture
}

function makeRoofTexture(width, depth) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#51565c'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const w = 10 + Math.random() * 18
    const h = 4 + Math.random() * 8
    ctx.fillRect(x, y, w, h)
  }

  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  for (let i = 0; i < 60; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(Math.max(1, width * 0.15), Math.max(1, depth * 0.15))
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  return texture
}

function createBuildingMesh(width, height, depth) {
  const facadeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.58 + Math.random() * 0.08, 0.12, 0.7),
    map: makeFacadeTexture(width, height),
    roughness: 0.5,
    metalness: 0.08,
    emissive: 0x101010,
    emissiveIntensity: 0.08,
  })

  const roofMaterial = new THREE.MeshStandardMaterial({
    map: makeRoofTexture(width, depth),
    color: 0x52585f,
    roughness: 0.9,
    metalness: 0.05,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), facadeMaterial)
  body.castShadow = true
  body.receiveShadow = true

  const roof = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.92, depth * 0.92), roofMaterial)
  roof.rotation.x = -Math.PI / 2
  roof.position.y = height / 2 + 0.02

  const group = new THREE.Group()
  group.add(body)
  group.add(roof)

  const detailCount = 1 + Math.floor(Math.random() * 3)
  for (let i = 0; i < detailCount; i++) {
    const detailWidth = 0.25 + Math.random() * 0.45
    const detailDepth = 0.25 + Math.random() * 0.45
    const detailHeight = 0.15 + Math.random() * 0.35

    const detail = new THREE.Mesh(
      new THREE.BoxGeometry(detailWidth, detailHeight, detailDepth),
      roofMaterial
    )
    detail.position.set(
      (Math.random() - 0.5) * (width * 0.7),
      height / 2 + detailHeight / 2 + 0.02,
      (Math.random() - 0.5) * (depth * 0.7)
    )
    group.add(detail)
  }

  return group
}

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

    const building = createBuildingMesh(width, height, depth)
    building.position.set(worldX, height / 2, worldZ)
    buildings.add(building)
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

const pedestrians = []

function createPedestrian(color) {
  const group = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05 })
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffd8b7, roughness: 0.9, metalness: 0.02 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.12), bodyMat)
  body.position.y = 0.22
  group.add(body)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), headMat)
  head.position.y = 0.52
  group.add(head)

  const legGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.08)
  const leftLeg = new THREE.Mesh(legGeometry, bodyMat)
  const rightLeg = new THREE.Mesh(legGeometry, bodyMat)
  leftLeg.position.set(-0.05, 0.05, 0)
  rightLeg.position.set(0.05, 0.05, 0)
  group.add(leftLeg, rightLeg)

  group.userData.legs = { left: leftLeg, right: rightLeg }
  return group
}

function addPedestrianPath(path, speed) {
  const color = new THREE.Color(`hsl(${Math.random() * 360}, 55%, 55%)`)
  const person = createPedestrian(color)
  person.position.copy(path[0])
  person.userData.path = path
  person.userData.speed = speed
  person.userData.progress = 0
  person.userData.direction = 1
  pedestrians.push(person)
  scene.add(person)
}

function createPath(start, end, height) {
  return [new THREE.Vector3(start.x, height, start.z), new THREE.Vector3(end.x, height, end.z)]
}

const sidewalkY = 0.1
const halfCity = citySpan / 2
const pathOffset = roadWidth / 2 + sidewalkWidth / 2

for (let i = 1; i < gridSize; i += streetEvery) {
  const linePos = (i - gridSize / 2) * cellSize
  const leftSide = linePos - pathOffset
  const rightSide = linePos + pathOffset

  addPedestrianPath(
    createPath({ x: leftSide, z: -halfCity + 2 }, { x: leftSide, z: halfCity - 2 }, sidewalkY),
    1.2 + Math.random() * 0.7
  )
  addPedestrianPath(
    createPath({ x: rightSide, z: halfCity - 2 }, { x: rightSide, z: -halfCity + 2 }, sidewalkY),
    1.1 + Math.random() * 0.6
  )
  addPedestrianPath(
    createPath({ x: -halfCity + 2, z: leftSide }, { x: halfCity - 2, z: leftSide }, sidewalkY),
    1.0 + Math.random() * 0.6
  )
  addPedestrianPath(
    createPath({ x: halfCity - 2, z: rightSide }, { x: -halfCity + 2, z: rightSide }, sidewalkY),
    1.0 + Math.random() * 0.7
  )
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

  const walkCycle = Math.sin(clock.elapsedTime * 10) * 0.4
  for (const pedestrian of pedestrians) {
    const path = pedestrian.userData.path
    const speedFactor = pedestrian.userData.speed
    pedestrian.userData.progress += speedFactor * delta * 0.16 * pedestrian.userData.direction

    if (pedestrian.userData.progress >= 1 || pedestrian.userData.progress <= 0) {
      pedestrian.userData.direction *= -1
      pedestrian.userData.progress = THREE.MathUtils.clamp(pedestrian.userData.progress, 0, 1)
    }

    const nextPos = new THREE.Vector3().lerpVectors(path[0], path[1], pedestrian.userData.progress)
    pedestrian.position.copy(nextPos)

    const forward = new THREE.Vector3().subVectors(path[1], path[0]).normalize()
    if (pedestrian.userData.direction < 0) forward.multiplyScalar(-1)
    pedestrian.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward)

    const legs = pedestrian.userData.legs
    legs.left.rotation.x = walkCycle
    legs.right.rotation.x = -walkCycle
  }

  composer.render()
}

animate()
