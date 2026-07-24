import * as THREE from 'three'

const CENTER = new THREE.Vector2(0, 0)
const HOVER_SCALE = 1.04
const SCALE_DAMPING = 12

// look-to-interact: a raycast from the center of the screen (the reticle),
// active only while pointer-locked in walk mode. Objects register themselves
// with a label + click handler; this module owns hit-testing, the hover
// highlight, and the prompt UI — callers never touch a Raycaster directly.
export function createInteractionSystem({ camera, domElement, walk, ui }) {
  const raycaster = new THREE.Raycaster()
  const interactables = []
  const meshToEntry = new WeakMap()
  let hovered = null

  function register(object, { label, onInteract, maxDistance = 3 }) {
    const entry = { object, label, onInteract, maxDistance, targetScale: 1 }
    object.traverse((child) => {
      if (child.isMesh) meshToEntry.set(child, entry)
    })
    interactables.push(entry)
    return entry
  }

  function setHovered(next) {
    if (hovered === next) return
    if (hovered) hovered.targetScale = 1
    hovered = next
    if (hovered) hovered.targetScale = HOVER_SCALE

    ui.prompt.textContent = hovered ? hovered.label : ''
    ui.prompt.style.opacity = hovered ? '1' : '0'
  }

  function update(dt) {
    ui.crosshair.style.display = walk.isLocked ? 'block' : 'none'

    if (!walk.isLocked) {
      setHovered(null)
    } else {
      raycaster.setFromCamera(CENTER, camera)
      const objects = interactables.map((entry) => entry.object)
      const hits = raycaster.intersectObjects(objects, true)
      const hit = hits[0]
      const entry = hit ? meshToEntry.get(hit.object) : null
      setHovered(entry && hit.distance <= entry.maxDistance ? entry : null)
    }

    for (const entry of interactables) {
      const current = entry.object.scale.x
      const next = THREE.MathUtils.damp(current, entry.targetScale, SCALE_DAMPING, dt)
      entry.object.scale.setScalar(next)
    }
  }

  function onClick() {
    if (hovered) hovered.onInteract()
  }
  domElement.addEventListener('click', onClick)

  return { register, update }
}
