import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

export function createWallClock(house, x, y, z, rotationY) {
  const group = new THREE.Group()

  const faceMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1e7d4,
    roughness: 0.6,
  })
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2418,
    roughness: 0.5,
  })
  const handMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1512,
    roughness: 0.4,
  })

  const rim = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24), rimMaterial),
    { cast: false },
  )
  rim.rotation.z = Math.PI / 2
  group.add(rim)

  const face = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 24), faceMaterial),
    { cast: false },
  )
  face.rotation.z = Math.PI / 2
  face.position.x = 0.011
  group.add(face)

  // hour tick marks
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const tick = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.012), handMaterial),
      { cast: false },
    )
    tick.position.set(0.022, Math.cos(angle) * 0.19, Math.sin(angle) * 0.19)
    group.add(tick)
  }

  const hourHand = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.11, 0.02), handMaterial),
    { cast: false },
  )
  hourHand.geometry.translate(0, 0.055, 0)
  hourHand.position.x = 0.025
  group.add(hourHand)

  const minuteHand = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.16, 0.015), handMaterial),
    { cast: false },
  )
  minuteHand.geometry.translate(0, 0.08, 0)
  minuteHand.position.x = 0.03
  group.add(minuteHand)

  group.position.set(x, y, z)
  group.rotation.y = rotationY
  house.add(group)

  function update() {
    const now = new Date()
    const hours = now.getHours() % 12
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()

    const minuteFraction = minutes + seconds / 60
    const hourFraction = hours + minuteFraction / 60

    hourHand.rotation.x = (hourFraction / 12) * Math.PI * 2
    minuteHand.rotation.x = (minuteFraction / 60) * Math.PI * 2
  }
  update()

  return { group, update }
}
