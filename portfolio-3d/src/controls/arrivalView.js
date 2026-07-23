import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function createArrivalControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement)
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
  return controls
}
