import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

const SPIN_SPEED = 2.2 // rad/s — slow, ambient, not a hazard blur

export function createCeilingFan(house, x, y, z) {
  const group = new THREE.Group()

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.4,
    metalness: 0.7,
  })
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f2a1a,
    roughness: 0.6,
  })

  const mount = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), metalMaterial),
    { cast: false },
  )
  mount.position.y = 0.12
  group.add(mount)

  const hub = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 12), metalMaterial),
    { cast: false },
  )
  group.add(hub)

  const bladeGroup = new THREE.Group()
  const bladeCount = 4
  for (let i = 0; i < bladeCount; i++) {
    const blade = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.14), bladeMaterial),
      { cast: false },
    )
    const angle = (i / bladeCount) * Math.PI * 2
    blade.position.set(Math.cos(angle) * 0.42, 0, Math.sin(angle) * 0.42)
    blade.rotation.y = angle
    bladeGroup.add(blade)
  }
  group.add(bladeGroup)

  group.position.set(x, y, z)
  house.add(group)

  function update(dt) {
    bladeGroup.rotation.y += SPIN_SPEED * dt
  }

  return { group, update }
}
