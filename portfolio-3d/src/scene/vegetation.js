import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

function makeTree(scene, materials, x, z, scale = 1) {
  const tree = new THREE.Group()
  const trunk = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.4, 7), materials.trunk),
  )
  trunk.position.y = 0.7
  tree.add(trunk)

  for (let i = 0; i < 3; i++) {
    const foliage = addShadowMesh(
      new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 - i * 0.12, 0), materials.foliage),
    )
    foliage.position.set(
      (Math.random() - 0.5) * 0.3,
      1.5 + i * 0.55,
      (Math.random() - 0.5) * 0.3,
    )
    tree.add(foliage)
  }
  tree.position.set(x, 0, z)
  tree.scale.setScalar(scale)
  scene.add(tree)
}

function makeBush(scene, materials, x, z, scale = 1) {
  const bush = addShadowMesh(
    new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), materials.foliage),
  )
  bush.position.set(x, 0.3, z)
  bush.scale.setScalar(scale)
  scene.add(bush)
}

export function createVegetation(scene, materials) {
  makeTree(scene, materials, -6.5, -2, 1.3)
  makeTree(scene, materials, 6.2, -3.5, 1.1)
  makeTree(scene, materials, -5.5, 4, 0.9)
  makeTree(scene, materials, 5.8, 3.2, 1)

  makeBush(scene, materials, -2.0, 1.4, 1)
  makeBush(scene, materials, 2.0, 1.4, 1)
  makeBush(scene, materials, -3.4, 2.6, 0.8)
  makeBush(scene, materials, 3.4, 2.6, 0.8)
}
