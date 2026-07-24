import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

export function createGround(scene, materials) {
  const ground = addShadowMesh(
    new THREE.Mesh(new THREE.PlaneGeometry(120, 120), materials.grass),
    { cast: false },
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const path = addShadowMesh(
    new THREE.Mesh(new THREE.PlaneGeometry(1.8, 7.2), materials.path),
    { cast: false },
  )
  path.rotation.x = -Math.PI / 2
  path.position.set(0, 0.01, 4)
  scene.add(path)
}
