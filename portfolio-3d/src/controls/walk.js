import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

const EYE_HEIGHT = 1.75
const WALK_SPEED = 4.2
const WALK_DAMPING = 8

export function createWalkControls({
  camera,
  renderer,
  arrivalControls,
  houseFootprint,
  yardBounds,
  ui,
}) {
  const walkControls = new PointerLockControls(camera, renderer.domElement)
  const { walkBtn, walkHint, heroText } = ui

  const keys = { forward: false, back: false, left: false, right: false }
  const velocity = new THREE.Vector3()

  function isInsideHouse(x, z) {
    return (
      x > houseFootprint.minX &&
      x < houseFootprint.maxX &&
      z > houseFootprint.minZ &&
      z < houseFootprint.maxZ
    )
  }

  function resolveCollision(oldX, oldZ, newX, newZ) {
    let x = THREE.MathUtils.clamp(newX, yardBounds.minX, yardBounds.maxX)
    let z = THREE.MathUtils.clamp(newZ, yardBounds.minZ, yardBounds.maxZ)

    if (isInsideHouse(x, z)) {
      if (!isInsideHouse(x, oldZ)) z = oldZ
      else if (!isInsideHouse(oldX, z)) x = oldX
      else {
        x = oldX
        z = oldZ
      }
    }
    return { x, z }
  }

  function setKey(code, value) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = value
        break
      case 'KeyS':
      case 'ArrowDown':
        keys.back = value
        break
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = value
        break
      case 'KeyD':
      case 'ArrowRight':
        keys.right = value
        break
    }
  }
  document.addEventListener('keydown', (e) => setKey(e.code, true))
  document.addEventListener('keyup', (e) => setKey(e.code, false))

  walkBtn.addEventListener('click', () => walkControls.lock())

  walkControls.addEventListener('lock', () => {
    arrivalControls.enabled = false
    walkBtn.style.display = 'none'
    heroText.style.display = 'none'
    walkHint.style.display = 'block'
    camera.position.y = EYE_HEIGHT
  })

  walkControls.addEventListener('unlock', () => {
    arrivalControls.enabled = true
    walkBtn.style.display = 'block'
    heroText.style.display = 'block'
    walkHint.style.display = 'none'
    keys.forward = keys.back = keys.left = keys.right = false
    velocity.set(0, 0, 0)
  })

  function update(dt) {
    if (!walkControls.isLocked) return

    const inputX = Number(keys.right) - Number(keys.left)
    const inputZ = Number(keys.forward) - Number(keys.back)
    const inputLength = Math.hypot(inputX, inputZ) || 1

    velocity.x = THREE.MathUtils.damp(
      velocity.x,
      (inputX / inputLength) * WALK_SPEED,
      WALK_DAMPING,
      dt,
    )
    velocity.z = THREE.MathUtils.damp(
      velocity.z,
      (inputZ / inputLength) * WALK_SPEED,
      WALK_DAMPING,
      dt,
    )

    const oldX = camera.position.x
    const oldZ = camera.position.z

    walkControls.moveRight(velocity.x * dt)
    walkControls.moveForward(velocity.z * dt)

    const resolved = resolveCollision(
      oldX,
      oldZ,
      camera.position.x,
      camera.position.z,
    )
    camera.position.x = resolved.x
    camera.position.z = resolved.z
    camera.position.y = EYE_HEIGHT
  }

  return {
    controls: walkControls,
    update,
    get isLocked() {
      return walkControls.isLocked
    },
  }
}
