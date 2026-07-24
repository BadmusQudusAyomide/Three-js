import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

// a real fireplace flame isn't a steady glow — it gutters and jumps, so the
// light and the "flame" geometry both get noisy per-frame variation instead
// of a fixed intensity
const FLICKER_SPEED = 9
const FLICKER_AMOUNT = 0.35

export function createFireplace(house, x, z) {
  const group = new THREE.Group()

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d867a,
    roughness: 0.95,
  })
  const mantelMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f2a1a,
    roughness: 0.5,
  })
  const fireboxMaterial = new THREE.MeshStandardMaterial({
    color: 0x14100c,
    roughness: 0.9,
  })
  const flameMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7a2e,
    emissive: 0xff5a1a,
    emissiveIntensity: 2.2,
    roughness: 0.4,
  })
  const emberMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2418,
    emissive: 0xff8c3c,
    emissiveIntensity: 0.6,
    roughness: 0.9,
  })

  // stone surround
  const surround = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 0.4), stoneMaterial),
  )
  surround.position.set(0, 0.85, 0)
  group.add(surround)

  // firebox recess (dark cavity cut visually by just being darker/inset)
  const firebox = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 0.3), fireboxMaterial),
    { cast: false },
  )
  firebox.position.set(0, 0.55, 0.08)
  group.add(firebox)

  // mantel shelf
  const mantel = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.5), mantelMaterial),
  )
  mantel.position.set(0, 1.72, 0.05)
  group.add(mantel)

  // embers bed
  const embers = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.22), emberMaterial),
    { cast: false },
  )
  embers.position.set(0, 0.17, 0.1)
  group.add(embers)

  // flame tongues — a few overlapping cones, animated per-frame for flicker
  const flames = []
  for (let i = 0; i < 4; i++) {
    const flame = addShadowMesh(
      new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 8), flameMaterial),
      { cast: false },
    )
    const fx = (i - 1.5) * 0.16
    flame.position.set(fx, 0.35, 0.1)
    group.add(flame)
    flames.push({ mesh: flame, phase: i * 1.7, baseX: fx })
  }

  const fireLight = new THREE.PointLight(0xff7a2e, 5, 5, 1.8)
  fireLight.position.set(0, 0.5, 0.3)
  group.add(fireLight)

  group.position.set(x, 0, z)
  group.rotation.y = Math.PI / 2
  house.add(group)

  function update(t) {
    const flicker = Math.sin(t * FLICKER_SPEED) * 0.5 + Math.sin(t * FLICKER_SPEED * 2.3) * 0.5
    fireLight.intensity = 5 + flicker * FLICKER_AMOUNT * 5

    for (const f of flames) {
      const wobble = Math.sin(t * FLICKER_SPEED * 1.4 + f.phase)
      f.mesh.scale.y = 1 + wobble * 0.25
      f.mesh.position.x = f.baseX + Math.sin(t * 6 + f.phase) * 0.02
    }
  }

  return { group, update }
}
