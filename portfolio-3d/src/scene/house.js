import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'

const WALL_W = 8
const WALL_H = 3.6
const WALL_D = 6

// approximate footprint used for walk-mode collision
export const HOUSE_FOOTPRINT = { minX: -4, maxX: 4, minZ: -6.3, maxZ: 0.7 }

export function createHouse(scene, materials) {
  const house = new THREE.Group()

  const walls = addShadowMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(WALL_W, WALL_H, WALL_D),
      materials.wall,
    ),
  )
  walls.position.set(0, WALL_H / 2, -3)
  house.add(walls)

  // gable roof via extruded triangular profile
  const roofOverhangX = 0.5
  const roofOverhangZ = 0.5
  const roofPeak = 2.3
  const roofShape = new THREE.Shape()
  roofShape.moveTo(-WALL_W / 2 - roofOverhangX, 0)
  roofShape.lineTo(0, roofPeak)
  roofShape.lineTo(WALL_W / 2 + roofOverhangX, 0)
  roofShape.lineTo(WALL_W / 2 + roofOverhangX, 0.001)
  roofShape.lineTo(-WALL_W / 2 - roofOverhangX, 0.001)
  roofShape.closePath()

  const roofDepth = WALL_D + roofOverhangZ * 2
  const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
    depth: roofDepth,
    bevelEnabled: false,
  })
  roofGeometry.translate(0, 0, -roofDepth / 2)
  const roof = addShadowMesh(new THREE.Mesh(roofGeometry, materials.roof))
  roof.position.set(0, WALL_H, -3)
  house.add(roof)

  const chimney = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), materials.chimney),
  )
  chimney.position.set(2.4, WALL_H + 1.3, -4.2)
  house.add(chimney)

  // door
  const door = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.12), materials.door),
  )
  door.position.set(0, 1.1, 0.06)
  house.add(door)

  const doorFrame = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.34, 2.44, 0.08), materials.trim),
  )
  doorFrame.position.set(0, 1.22, 0.0)
  house.add(doorFrame)

  // ground-floor windows
  function makeWindow(x) {
    const frame = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.1), materials.trim),
    )
    frame.position.set(x, 1.9, 0.02)
    house.add(frame)

    const glass = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.06), materials.glassLit),
      { cast: false },
    )
    glass.position.set(x, 1.9, 0.06)
    house.add(glass)
  }
  makeWindow(-2.6)
  makeWindow(2.6)

  // upper (balcony) window
  const upperFrame = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.1), materials.trim),
  )
  upperFrame.position.set(0, 2.85, 0.02)
  house.add(upperFrame)

  const upperGlass = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.06), materials.glassLit),
    { cast: false },
  )
  upperGlass.position.set(0, 2.85, 0.06)
  house.add(upperGlass)

  // balcony slab + brackets
  const balconySlab = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 0.7), materials.trim),
  )
  balconySlab.position.set(0, 2.05, 0.4)
  house.add(balconySlab)

  for (const bx of [-0.85, 0.85]) {
    const bracket = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.5), materials.wood),
    )
    bracket.position.set(bx, 1.85, 0.35)
    bracket.rotation.x = -0.35
    house.add(bracket)
  }

  // balcony railing
  const railGroup = new THREE.Group()
  const railTop = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.06), materials.metal),
  )
  railTop.position.set(0, 0.55, 0.72)
  railGroup.add(railTop)

  for (let i = 0; i < 9; i++) {
    const bx = -0.9 + (i * 1.8) / 8
    const baluster = addShadowMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), materials.metal),
    )
    baluster.position.set(bx, 0.3, 0.72)
    railGroup.add(baluster)
  }
  for (const sx of [-1.0, 1.0]) {
    const sideRail = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.34), materials.metal),
    )
    sideRail.position.set(sx, 0.3, 0.55)
    railGroup.add(sideRail)
  }
  railGroup.position.set(0, 2.05, 0)
  house.add(railGroup)

  // balcony support pillars either side of the door, up to the balcony slab
  for (const px of [-1.35, 1.35]) {
    const pillar = addShadowMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 2.1, 10), materials.trim),
    )
    pillar.position.set(px, 1.05, 0.55)
    house.add(pillar)
  }

  // entry steps
  for (let i = 0; i < 3; i++) {
    const step = addShadowMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(1.8 + i * 0.3, 0.12, 0.34),
        materials.stone,
      ),
    )
    step.position.set(0, 0.06 + i * 0.12, 0.9 - i * 0.3)
    house.add(step)
  }

  scene.add(house)
  return house
}
