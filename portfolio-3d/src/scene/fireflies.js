import * as THREE from 'three'

const FIREFLY_COUNT = 50

export function createFireflies(scene) {
  const geometry = new THREE.SphereGeometry(0.035, 6, 6)
  const material = new THREE.MeshBasicMaterial({ color: 0xffd699 })
  const fireflies = new THREE.InstancedMesh(geometry, material, FIREFLY_COUNT)

  const data = []
  const dummy = new THREE.Object3D()
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    const cx = (Math.random() - 0.5) * 12
    const cz = 1 + Math.random() * 7
    const cy = 0.4 + Math.random() * 1.2
    data.push({
      cx,
      cy,
      cz,
      freq: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      amp: 0.3 + Math.random() * 0.4,
    })
    dummy.position.set(cx, cy, cz)
    dummy.updateMatrix()
    fireflies.setMatrixAt(i, dummy.matrix)
  }
  scene.add(fireflies)

  function update(t) {
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const f = data[i]
      dummy.position.set(
        f.cx + Math.sin(t * f.freq + f.phase) * f.amp,
        f.cy + Math.sin(t * f.freq * 1.7 + f.phase) * 0.25,
        f.cz + Math.cos(t * f.freq + f.phase) * f.amp,
      )
      dummy.updateMatrix()
      fireflies.setMatrixAt(i, dummy.matrix)
    }
    fireflies.instanceMatrix.needsUpdate = true
  }

  return { update }
}
