import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const ORB_COUNT = 1400

document.body.innerHTML = `
  <aside id="sidebar">
    <h1>Shapes</h1>
    <button id="shape-love" class="shape-btn" data-active="false">Love</button>
  </aside>
`

const scene = new THREE.Scene()

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
controls.autoRotateSpeed = 0.5
controls.minDistance = 6
controls.maxDistance = 30

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
const orbMaterial = new THREE.MeshBasicMaterial({
  vertexColors: true,
})

const orbs = new THREE.InstancedMesh(orbGeometry, orbMaterial, ORB_COUNT)
orbs.instanceColor = new THREE.InstancedBufferAttribute(
  new Float32Array(ORB_COUNT * 3),
  3,
)
scene.add(orbs)

const dummy = new THREE.Object3D()
// red-forward palette with a couple of cool accent tones, like planets against a red sun
const palette = [
  new THREE.Color(0xff2200),
  new THREE.Color(0xff5533),
  new THREE.Color(0xffaa33),
  new THREE.Color(0x4fc3f7),
]

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3)
}

const orbData = []
const HEART_SCALE = 4.4
const FLOAT_SPREAD = 9

for (let i = 0; i < ORB_COUNT; i++) {
  const { x, y } = sampleHeartPoint()
  const heartX = x * HEART_SCALE
  const heartY = y * HEART_SCALE
  const heartZ = (Math.random() - 0.5) * 1.4

  const idleCenter = {
    x: (Math.random() * 2 - 1) * FLOAT_SPREAD,
    y: (Math.random() * 2 - 1) * FLOAT_SPREAD * 0.6,
    z: (Math.random() * 2 - 1) * FLOAT_SPREAD * 0.6,
  }
  const idleAmp = {
    x: 0.6 + Math.random() * 1.2,
    y: 0.6 + Math.random() * 1.2,
    z: 0.6 + Math.random() * 1.2,
  }
  const idleFreq = {
    x: 0.08 + Math.random() * 0.1,
    y: 0.08 + Math.random() * 0.1,
    z: 0.08 + Math.random() * 0.1,
  }
  const idlePhase = {
    x: Math.random() * Math.PI * 2,
    y: Math.random() * Math.PI * 2,
    z: Math.random() * Math.PI * 2,
  }

  const size = 0.16 + Math.random() * 0.14
  const color = palette[Math.floor(Math.random() * palette.length)]

  orbData.push({
    heartX,
    heartY,
    heartZ,
    idleCenter,
    idleAmp,
    idleFreq,
    idlePhase,
    size,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.5 + Math.random() * 0.6,
    delay: Math.random() * 2.2,
    duration: 3 + Math.random() * 2.5,
  })

  orbs.setColorAt(i, color)
}
orbs.instanceColor.needsUpdate = true

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

function idlePosition(d, t) {
  return {
    x: d.idleCenter.x + Math.sin(t * d.idleFreq.x + d.idlePhase.x) * d.idleAmp.x,
    y: d.idleCenter.y + Math.sin(t * d.idleFreq.y + d.idlePhase.y * 1.3) * d.idleAmp.y,
    z: d.idleCenter.z + Math.sin(t * d.idleFreq.z + d.idlePhase.z * 1.7) * d.idleAmp.z,
  }
}

function heartPosition(d, t) {
  const wobble = Math.sin(t * d.wobbleSpeed + d.wobblePhase) * 0.04
  return { x: d.heartX, y: d.heartY, z: d.heartZ + wobble }
}

const modeFns = { floating: idlePosition, love: heartPosition }

let mode = 'floating'
let prevMode = 'floating'
let toggleTime = -1000

const loveButton = document.getElementById('shape-love')
loveButton.addEventListener('click', () => {
  prevMode = mode
  mode = mode === 'love' ? 'floating' : 'love'
  toggleTime = clock.getElapsedTime()
  loveButton.dataset.active = String(mode === 'love')
  loveButton.textContent = mode === 'love' ? 'Release' : 'Love'
})

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  const targetFn = modeFns[mode]
  const prevFn = modeFns[prevMode]

  for (let i = 0; i < ORB_COUNT; i++) {
    const d = orbData[i]
    const startTime = toggleTime + d.delay

    let pos
    if (t < startTime) {
      pos = prevFn(d, t)
    } else {
      const progress = Math.min((t - startTime) / d.duration, 1)
      const eased = easeOutCubic(progress)
      const from = prevFn(d, startTime)
      const to = targetFn(d, t)
      pos = {
        x: from.x + (to.x - from.x) * eased,
        y: from.y + (to.y - from.y) * eased,
        z: from.z + (to.z - from.z) * eased,
      }
    }

    dummy.position.set(pos.x, pos.y, pos.z)
    dummy.scale.setScalar(d.size)
    dummy.updateMatrix()
    orbs.setMatrixAt(i, dummy.matrix)
  }
  orbs.instanceMatrix.needsUpdate = true

  controls.update()
  renderer.render(scene, camera)
}

animate()
