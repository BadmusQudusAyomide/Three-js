import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

const INTERIOR_W = 8
const INTERIOR_H = 3.6
const INTERIOR_D = 6
const WALL_T = 0.15

// walkable interior floor area, inset from the wall shell
export const INTERIOR_ROOM = {
  minX: -INTERIOR_W / 2 + WALL_T,
  maxX: INTERIOR_W / 2 - WALL_T,
  minZ: -INTERIOR_D + WALL_T,
  maxZ: -0.15,
}

export function createInterior(house) {
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b4a34,
    roughness: 0.55,
  })
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1e7d4,
    roughness: 0.9,
  })
  const interiorWallMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1e4cd,
    roughness: 0.85,
  })

  const floorW = INTERIOR_W - WALL_T * 2
  const floorD = INTERIOR_D - WALL_T
  const floorCenterZ = -floorD / 2

  const floor = addShadowMesh(
    new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), floorMaterial),
    { cast: false },
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, 0.02, floorCenterZ)
  house.add(floor)

  const ceiling = addShadowMesh(
    new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), ceilingMaterial),
    { cast: false },
  )
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.set(0, INTERIOR_H - 0.02, floorCenterZ)
  house.add(ceiling)

  const backWall = addShadowMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(INTERIOR_W, INTERIOR_H, WALL_T),
      interiorWallMaterial,
    ),
  )
  backWall.position.set(0, INTERIOR_H / 2, -INTERIOR_D + WALL_T / 2)
  house.add(backWall)

  for (const side of [-1, 1]) {
    const sideWall = addShadowMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(WALL_T, INTERIOR_H, INTERIOR_D),
        interiorWallMaterial,
      ),
    )
    sideWall.position.set(
      side * (INTERIOR_W / 2 - WALL_T / 2),
      INTERIOR_H / 2,
      -INTERIOR_D / 2,
    )
    house.add(sideWall)
  }

  // no shadow casting here: this light sits close to the ceiling in a tight
  // room and shadow-mapping it produces acne that reads as the whole
  // interior being unlit, which defeats the point of a room light
  const pendantLight = new THREE.PointLight(0xffcf9e, 9, 14, 1.6)
  pendantLight.position.set(0, INTERIOR_H - 0.5, -3)
  house.add(pendantLight)

  // fill light near the entry so the room is clearly visible from outside
  // the moment the door swings open, instead of fading to black at the
  // threshold
  const entryLight = new THREE.PointLight(0xffcf9e, 4, 6, 1.6)
  entryLight.position.set(0, 2.0, -1.2)
  house.add(entryLight)

  const fixtureMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2418,
    emissive: 0xffcf9e,
    emissiveIntensity: 1.6,
  })
  const fixture = addShadowMesh(
    new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), fixtureMaterial),
    { cast: false },
  )
  fixture.position.copy(pendantLight.position)
  house.add(fixture)
}
