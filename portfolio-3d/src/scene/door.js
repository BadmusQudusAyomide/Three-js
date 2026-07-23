import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

export const DOOR_WIDTH = 1.1
export const DOOR_HEIGHT = 2.2
const DOOR_THICKNESS = 0.12

const OPEN_ANGLE = Math.PI * 0.55
const OPEN_RADIUS = 3.2
const SWING_DAMPING = 4.5

export function createDoor(materials) {
  // pivot sits on the hinge (left edge of the opening), so rotating it swings the door
  const pivot = new THREE.Group()
  pivot.position.set(-DOOR_WIDTH / 2, 0, 0)

  const doorMesh = addShadowMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, DOOR_THICKNESS),
      materials.door,
    ),
  )
  doorMesh.position.set(DOOR_WIDTH / 2, DOOR_HEIGHT / 2, DOOR_THICKNESS / 2)
  pivot.add(doorMesh)

  // handle, mounted near the free edge (opposite the hinge)
  const handleBar = addShadowMesh(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8),
      materials.metal,
    ),
  )
  handleBar.rotation.z = Math.PI / 2
  handleBar.position.set(DOOR_WIDTH - 0.18, DOOR_HEIGHT / 2, DOOR_THICKNESS + 0.05)
  pivot.add(handleBar)

  const handleKnob = addShadowMesh(
    new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), materials.metal),
  )
  handleKnob.position.set(DOOR_WIDTH - 0.18, DOOR_HEIGHT / 2, DOOR_THICKNESS + 0.16)
  pivot.add(handleKnob)

  let currentAngle = 0
  const threshold = new THREE.Vector2(0, 0.3)
  const cameraXZ = new THREE.Vector2()

  function update(cameraPosition, dt) {
    cameraXZ.set(cameraPosition.x, cameraPosition.z)
    const distance = cameraXZ.distanceTo(threshold)

    const targetAngle = distance < OPEN_RADIUS ? OPEN_ANGLE : 0
    currentAngle = THREE.MathUtils.damp(currentAngle, targetAngle, SWING_DAMPING, dt)
    pivot.rotation.y = currentAngle
  }

  return { group: pivot, update }
}
