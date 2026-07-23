import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const ORB_COUNT = 1400

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x030008, 0.045)

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
)
camera.position.set(0, 0, 14)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.autoRotate = true
controls.autoRotateSpeed = 0.8
controls.minDistance = 6
controls.maxDistance = 30

scene.add(new THREE.AmbientLight(0xffffff, 0.4))
const pointLight = new THREE.PointLight(0xff5588, 6, 40)
pointLight.position.set(0, 2, 10)
scene.add(pointLight)

// implicit heart curve: f(x,y) <= 0 marks the inside of the shape
function insideHeart(x, y) {
  const f = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y
  return f <= 0
}

function sampleHeartPoint() {
  let x
  let y
  do {
    x = (Math.random() * 2 - 1) * 1.4
    y = (Math.random() * 2 - 1) * 1.3 + 0.1
  } while (!insideHeart(x, y))
  return { x, y }
}

const orbGeometry = new THREE.IcosahedronGeometry(1, 2)
const orbMaterial = new THREE.MeshStandardMaterial({
  emissive: 0xffffff,
  emissiveIntensity: 1.4,
  color: 0x220011,
  roughness: 0.35,
  metalness: 0.1,
})

const orbs = new THREE.InstancedMesh(orbGeometry, orbMaterial, ORB_COUNT)
orbs.instanceColor = new THREE.InstancedBufferAttribute(
  new Float32Array(ORB_COUNT * 3),
  3,
)
scene.add(orbs)

const dummy = new THREE.Object3D()
const palette = [
  new THREE.Color(0xff2d6f),
  new THREE.Color(0xff6fa5),
  new THREE.Color(0xffd1dc),
  new THREE.Color(0xff0044),
]

const orbData = []

const SCALE = 4.4
for (let i = 0; i < ORB_COUNT; i++) {
  const { x, y } = sampleHeartPoint()
  const depth = (Math.random() - 0.5) * 1.4
  const baseX = x * SCALE
  const baseY = y * SCALE
  const baseZ = depth

  const size = 0.05 + Math.random() * 0.09
  const color = palette[Math.floor(Math.random() * palette.length)]

  orbData.push({
    baseX,
    baseY,
    baseZ,
    size,
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 0.8,
  })

  dummy.position.set(baseX, baseY, baseZ)
  dummy.scale.setScalar(size)
  dummy.updateMatrix()
  orbs.setMatrixAt(i, dummy.matrix)
  orbs.setColorAt(i, color)
}
orbs.instanceMatrix.needsUpdate = true
orbs.instanceColor.needsUpdate = true

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.1,
  0.7,
  0.15,
)
composer.addPass(bloomPass)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
})

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  const pulse = 1 + 0.06 * Math.sin(t * 1.6)
  for (let i = 0; i < ORB_COUNT; i++) {
    const d = orbData[i]
    const wobble = Math.sin(t * d.speed + d.phase) * 0.05
    dummy.position.set(d.baseX, d.baseY, d.baseZ + wobble)
    dummy.scale.setScalar(d.size * pulse)
    dummy.updateMatrix()
    orbs.setMatrixAt(i, dummy.matrix)
  }
  orbs.instanceMatrix.needsUpdate = true

  controls.update()
  composer.render()
}

animate()
