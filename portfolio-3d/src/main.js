import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

document.body.innerHTML = `
  <div id="loading">Arriving…</div>
  <div id="hero-text">
    <h1>Your Name</h1>
    <p>Welcome home — look around</p>
  </div>
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

// ---------- sky + sun ----------
const sky = new Sky()
sky.scale.setScalar(450)
scene.add(sky)

const sunPosition = new THREE.Vector3()
const elevation = 7
const azimuth = 195
const phi = THREE.MathUtils.degToRad(90 - elevation)
const theta = THREE.MathUtils.degToRad(azimuth)
sunPosition.setFromSphericalCoords(1, phi, theta)

const skyUniforms = sky.material.uniforms
skyUniforms.turbidity.value = 6
skyUniforms.rayleigh.value = 2.2
skyUniforms.mieCoefficient.value = 0.012
skyUniforms.mieDirectionalG.value = 0.9
skyUniforms.sunPosition.value.copy(sunPosition)

scene.fog = new THREE.Fog(0xf2c69a, 16, 60)

// ---------- lights ----------
const hemiLight = new THREE.HemisphereLight(0x9fb4d8, 0x3a2f28, 0.55)
scene.add(hemiLight)

const sunLight = new THREE.DirectionalLight(0xffcf9e, 2.4)
sunLight.position.copy(sunPosition).multiplyScalar(60)
sunLight.castShadow = true
sunLight.shadow.mapSize.set(2048, 2048)
sunLight.shadow.camera.near = 10
sunLight.shadow.camera.far = 120
sunLight.shadow.camera.left = -18
sunLight.shadow.camera.right = 18
sunLight.shadow.camera.top = 18
sunLight.shadow.camera.bottom = -18
sunLight.shadow.bias = -0.0015
scene.add(sunLight)
scene.add(sunLight.target)
sunLight.target.position.set(0, 1, -3)

const porchLight = new THREE.PointLight(0xffb066, 6, 8, 2)
porchLight.position.set(0, 2.6, 0.6)
porchLight.castShadow = true
scene.add(porchLight)

// ---------- materials ----------
const materials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x4c7a3f, roughness: 1 }),
  path: new THREE.MeshStandardMaterial({ color: 0xb8a98c, roughness: 0.9 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xe9dcc4, roughness: 0.85 }),
  trim: new THREE.MeshStandardMaterial({ color: 0xf5ead2, roughness: 0.7 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x8a3a2b, roughness: 0.7 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x4a2e1f, roughness: 0.6 }),
  door: new THREE.MeshStandardMaterial({ color: 0x5c3320, roughness: 0.5 }),
  glassLit: new THREE.MeshStandardMaterial({
    color: 0x2c2a1c,
    emissive: 0xffb35c,
    emissiveIntensity: 1.1,
    roughness: 0.3,
  }),
  stone: new THREE.MeshStandardMaterial({ color: 0x8d867a, roughness: 0.95 }),
  metal: new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.4,
    metalness: 0.7,
  }),
  lantern: new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    emissive: 0xffb35c,
    emissiveIntensity: 1.8,
    roughness: 0.4,
  }),
  foliage: new THREE.MeshStandardMaterial({ color: 0x3f6b34, roughness: 1 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x4a3221, roughness: 1 }),
  chimney: new THREE.MeshStandardMaterial({ color: 0x9a6a52, roughness: 0.9 }),
}

function addShadowMesh(mesh, { cast = true, receive = true } = {}) {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
  return mesh
}

// ---------- ground ----------
const ground = addShadowMesh(
  new THREE.Mesh(new THREE.PlaneGeometry(120, 120), materials.grass),
  { cast: false },
)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

const path = addShadowMesh(
  new THREE.Mesh(new THREE.PlaneGeometry(1.8, 7.2), materials.path),
  { cast: false },
)
path.rotation.x = -Math.PI / 2
path.position.set(0, 0.01, 4)
scene.add(path)

// ---------- house ----------
const house = new THREE.Group()

const WALL_W = 8
const WALL_H = 3.6
const WALL_D = 6

const walls = addShadowMesh(
  new THREE.Mesh(
    new THREE.BoxGeometry(WALL_W, WALL_H, WALL_D),
    materials.wall,
  ),
)
walls.position.set(0, WALL_H / 2, -3)
house.add(walls)

// gable roof via extruded triangular profile
const roofOverhangX = 0.5
const roofOverhangZ = 0.5
const roofPeak = 2.3
const roofShape = new THREE.Shape()
roofShape.moveTo(-WALL_W / 2 - roofOverhangX, 0)
roofShape.lineTo(0, roofPeak)
roofShape.lineTo(WALL_W / 2 + roofOverhangX, 0)
roofShape.lineTo(WALL_W / 2 + roofOverhangX, 0.001)
roofShape.lineTo(-WALL_W / 2 - roofOverhangX, 0.001)
roofShape.closePath()

const roofDepth = WALL_D + roofOverhangZ * 2
const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
  depth: roofDepth,
  bevelEnabled: false,
})
roofGeometry.translate(0, 0, -roofDepth / 2)
const roof = addShadowMesh(new THREE.Mesh(roofGeometry, materials.roof))
roof.position.set(0, WALL_H, -3)
house.add(roof)

const chimney = addShadowMesh(
  new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), materials.chimney),
)
chimney.position.set(2.4, WALL_H + 1.3, -4.2)
house.add(chimney)

// door
const door = addShadowMesh(
  new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.12), materials.door),
)
door.position.set(0, 1.1, 0.06)
house.add(door)

const doorFrame = addShadowMesh(
  new THREE.Mesh(new THREE.BoxGeometry(1.34, 2.44, 0.08), materials.trim),
)
doorFrame.position.set(0, 1.22, 0.0)
house.add(doorFrame)

// ground-floor windows
function makeWindow(x) {
  const frame = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.1), materials.trim),
  )
  frame.position.set(x, 1.9, 0.02)
  house.add(frame)

  const glass = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.06), materials.glassLit),
    { cast: false },
  )
  glass.position.set(x, 1.9, 0.06)
  house.add(glass)
}
makeWindow(-2.6)
makeWindow(2.6)

// upper (balcony) window
const upperFrame = addShadowMesh(
  new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.1), materials.trim),
)
upperFrame.position.set(0, 2.85, 0.02)
house.add(upperFrame)

const upperGlass = addShadowMesh(
  new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.06), materials.glassLit),
  { cast: false },
)
upperGlass.position.set(0, 2.85, 0.06)
house.add(upperGlass)

// balcony slab + brackets
const balconySlab = addShadowMesh(
  new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.7), materials.trim),
)
balconySlab.position.set(0, 2.05, 0.4)
house.add(balconySlab)

for (const bx of [-0.85, 0.85]) {
  const bracket = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.5), materials.wood),
  )
  bracket.position.set(bx, 1.85, 0.35)
  bracket.rotation.x = -0.35
  house.add(bracket)
}

// balcony railing
const railGroup = new THREE.Group()
const railTop = addShadowMesh(
  new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.06), materials.metal),
)
railTop.position.set(0, 0.55, 0.72)
railGroup.add(railTop)

for (let i = 0; i < 9; i++) {
  const bx = -0.9 + (i * 1.8) / 8
  const baluster = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), materials.metal),
  )
  baluster.position.set(bx, 0.3, 0.72)
  railGroup.add(baluster)
}
for (const sx of [-1.0, 1.0]) {
  const sideRail = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.34), materials.metal),
  )
  sideRail.position.set(sx, 0.3, 0.55)
  railGroup.add(sideRail)
}
railGroup.position.set(0, 2.05, 0)
house.add(railGroup)

// balcony support pillars either side of the door, up to the balcony slab
for (const px of [-1.35, 1.35]) {
  const pillar = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 2.1, 10), materials.trim),
  )
  pillar.position.set(px, 1.05, 0.55)
  house.add(pillar)
}

// entry steps
for (let i = 0; i < 3; i++) {
  const step = addShadowMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(1.8 + i * 0.3, 0.12, 0.34),
      materials.stone,
    ),
  )
  step.position.set(0, 0.06 + i * 0.12, 0.9 - i * 0.3)
  house.add(step)
}

scene.add(house)

// ---------- gate ----------
const gate = new THREE.Group()
const GATE_Z = 6.6

function gatePillar(x) {
  const pillar = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.45), materials.stone),
  )
  pillar.position.set(x, 0.9, GATE_Z)
  gate.add(pillar)

  const cap = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.56), materials.stone),
  )
  cap.position.set(x, 1.87, GATE_Z)
  gate.add(cap)

  const lanternGlass = addShadowMesh(
    new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), materials.lantern),
    { cast: false },
  )
  lanternGlass.position.set(x, 2.15, GATE_Z)
  gate.add(lanternGlass)

  const lanternLight = new THREE.PointLight(0xffb066, 4, 6, 2)
  lanternLight.position.set(x, 2.15, GATE_Z)
  gate.add(lanternLight)
}
gatePillar(-1.4)
gatePillar(1.4)

// low fence running left/right from the pillars
function fenceRun(direction) {
  const run = new THREE.Group()
  const postCount = 8
  for (let i = 1; i <= postCount; i++) {
    const post = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), materials.wood),
    )
    post.position.set(direction * (1.4 + i * 0.6), 0.35, GATE_Z)
    run.add(post)
  }
  const rail = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(postCount * 0.6, 0.08, 0.08), materials.wood),
  )
  rail.position.set(direction * (1.4 + (postCount * 0.6) / 2 + 0.3), 0.55, GATE_Z)
  run.add(rail)
  return run
}
gate.add(fenceRun(1))
gate.add(fenceRun(-1))

scene.add(gate)

// ---------- trees & bushes ----------
function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group()
  const trunk = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.4, 7), materials.trunk),
  )
  trunk.position.y = 0.7
  tree.add(trunk)

  for (let i = 0; i < 3; i++) {
    const foliage = addShadowMesh(
      new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 - i * 0.12, 0), materials.foliage),
    )
    foliage.position.set(
      (Math.random() - 0.5) * 0.3,
      1.5 + i * 0.55,
      (Math.random() - 0.5) * 0.3,
    )
    tree.add(foliage)
  }
  tree.position.set(x, 0, z)
  tree.scale.setScalar(scale)
  scene.add(tree)
}
makeTree(-6.5, -2, 1.3)
makeTree(6.2, -3.5, 1.1)
makeTree(-5.5, 4, 0.9)
makeTree(5.8, 3.2, 1)

function makeBush(x, z, scale = 1) {
  const bush = addShadowMesh(
    new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), materials.foliage),
  )
  bush.position.set(x, 0.3, z)
  bush.scale.setScalar(scale)
  scene.add(bush)
}
makeBush(-2.0, 1.4, 1)
makeBush(2.0, 1.4, 1)
makeBush(-3.4, 2.6, 0.8)
makeBush(3.4, 2.6, 0.8)

// ---------- fireflies ----------
const FIREFLY_COUNT = 50
const fireflyGeometry = new THREE.SphereGeometry(0.035, 6, 6)
const fireflyMaterial = new THREE.MeshBasicMaterial({ color: 0xffd699 })
const fireflies = new THREE.InstancedMesh(
  fireflyGeometry,
  fireflyMaterial,
  FIREFLY_COUNT,
)
const fireflyData = []
const dummy = new THREE.Object3D()
for (let i = 0; i < FIREFLY_COUNT; i++) {
  const cx = (Math.random() - 0.5) * 12
  const cz = 1 + Math.random() * 7
  const cy = 0.4 + Math.random() * 1.2
  fireflyData.push({
    cx,
    cy,
    cz,
    freq: 0.4 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    amp: 0.3 + Math.random() * 0.4,
  })
  dummy.position.set(cx, cy, cz)
  dummy.updateMatrix()
  fireflies.setMatrixAt(i, dummy.matrix)
}
scene.add(fireflies)

// ---------- controls ----------
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.07
controls.target.set(0, 2.1, -1.5)
controls.minDistance = 5
controls.maxDistance = 13
controls.minPolarAngle = Math.PI / 2 - 0.45
controls.maxPolarAngle = Math.PI / 2 + 0.12
controls.minAzimuthAngle = -0.85
controls.maxAzimuthAngle = 0.85
controls.enablePan = false
controls.update()

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
  const t = clock.getElapsedTime()

  for (let i = 0; i < FIREFLY_COUNT; i++) {
    const f = fireflyData[i]
    dummy.position.set(
      f.cx + Math.sin(t * f.freq + f.phase) * f.amp,
      f.cy + Math.sin(t * f.freq * 1.7 + f.phase) * 0.25,
      f.cz + Math.cos(t * f.freq + f.phase) * f.amp,
    )
    dummy.updateMatrix()
    fireflies.setMatrixAt(i, dummy.matrix)
  }
  fireflies.instanceMatrix.needsUpdate = true

  porchLight.intensity = 6 + Math.sin(t * 3) * 0.3

  controls.update()
  renderer.render(scene, camera)
}

animate()
