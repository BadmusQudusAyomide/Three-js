import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

export const DOOR_WIDTH = 1.1
export const DOOR_HEIGHT = 2.2
const DOOR_THICKNESS = 0.12

const OPEN_ANGLE = Math.PI * 0.55
const OPEN_RADIUS = 3.2
const CLOSE_RADIUS = 4.0 // wider than OPEN_RADIUS so the door doesn't flicker at the edge

// spring-damper constants tuned to feel like a real hinged door: it
// accelerates from rest, swings with a bit of weight, and settles with a
// touch of overshoot instead of snapping straight to the target angle.
const SPRING_STIFFNESS = 55
const SPRING_DAMPING = 10

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
  let angularVelocity = 0
  let isOpen = false
  const threshold = new THREE.Vector2(0, 0.3)
  const cameraXZ = new THREE.Vector2()

  function update(cameraPosition, dt) {
    cameraXZ.set(cameraPosition.x, cameraPosition.z)
    const distance = cameraXZ.distanceTo(threshold)

    // hysteresis: open when close, only close once well clear, so standing
    // near the boundary doesn't make the door flutter open/closed
    if (isOpen) {
      if (distance > CLOSE_RADIUS) isOpen = false
    } else if (distance < OPEN_RADIUS) {
      isOpen = true
    }
    const targetAngle = isOpen ? OPEN_ANGLE : 0

    // integrate a damped spring instead of a flat exponential decay, so the
    // door starts slow, swings with momentum, and settles with a slight
    // overshoot like a real hinge rather than snapping to the target
    const restoring = -SPRING_STIFFNESS * (currentAngle - targetAngle)
    const damping = -SPRING_DAMPING * angularVelocity
    angularVelocity += (restoring + damping) * dt
    currentAngle += angularVelocity * dt
    currentAngle = THREE.MathUtils.clamp(currentAngle, -0.05, OPEN_ANGLE + 0.08)

    pivot.rotation.y = currentAngle
  }

  return { group: pivot, update }
}
