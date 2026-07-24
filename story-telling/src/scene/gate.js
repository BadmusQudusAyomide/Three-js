import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

const GATE_Z = 6.6

export function createGate(scene, materials) {
  const gate = new THREE.Group()

  function gatePillar(x) {
    const pillar = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.45), materials.stone),
    )
    pillar.position.set(x, 0.9, GATE_Z)
    gate.add(pillar)

    const cap = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.56), materials.stone),
    )
    cap.position.set(x, 1.87, GATE_Z)
    gate.add(cap)

    const lanternGlass = addShadowMesh(
      new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), materials.lantern),
      { cast: false },
    )
    lanternGlass.position.set(x, 2.15, GATE_Z)
    gate.add(lanternGlass)

    const lanternLight = new THREE.PointLight(0xffb066, 4, 6, 2)
    lanternLight.position.set(x, 2.15, GATE_Z)
    gate.add(lanternLight)
  }
  gatePillar(-1.4)
  gatePillar(1.4)

  // low fence running left/right from the pillars
  function fenceRun(direction) {
    const run = new THREE.Group()
    const postCount = 8
    for (let i = 1; i <= postCount; i++) {
      const post = addShadowMesh(
        new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), materials.wood),
      )
      post.position.set(direction * (1.4 + i * 0.6), 0.35, GATE_Z)
      run.add(post)
    }
    const rail = addShadowMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(postCount * 0.6, 0.08, 0.08),
        materials.wood,
      ),
    )
    rail.position.set(direction * (1.4 + (postCount * 0.6) / 2 + 0.3), 0.55, GATE_Z)
    run.add(rail)
    return run
  }
  gate.add(fenceRun(1))
  gate.add(fenceRun(-1))

  scene.add(gate)
  return gate
}
