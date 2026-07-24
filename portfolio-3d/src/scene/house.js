import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'
import { createDoor, DOOR_WIDTH, DOOR_HEIGHT } from './door.js'
import { createInterior, INTERIOR_ROOM, FURNITURE_BLOCKERS } from './interior.js'
import { WALL_W, WALL_H, WALL_D, WALL_T, WALL_CLEARANCE } from './houseDimensions.js'

// approximate footprint used for walk-mode collision. The side/back edges
// get extra WALL_CLEARANCE so the camera can't walk up to touching distance
// of the exterior wall (near-clip plane would poke through it) — maxZ is
// the porch/steps side, not a wall, so it's left at the true edge
export const HOUSE_FOOTPRINT = {
  minX: -WALL_W / 2 - WALL_CLEARANCE,
  maxX: WALL_W / 2 + WALL_CLEARANCE,
  minZ: -(WALL_D + 0.3) - WALL_CLEARANCE,
  maxZ: 0.7,
}

// the doorway itself is always walkable, bridging outside to the interior room.
// bounds intentionally reach past HOUSE_FOOTPRINT.maxZ and INTERIOR_ROOM.maxZ
// on both ends so there's no thin blocked sliver right at the threshold.
const DOOR_GAP = {
  minX: -DOOR_WIDTH / 2,
  maxX: DOOR_WIDTH / 2,
  minZ: -0.2,
  maxZ: 0.8,
}

function insideRect(x, z, rect) {
  return x > rect.minX && x < rect.maxX && z > rect.minZ && z < rect.maxZ
}

export function isHouseBlocking(x, z) {
  if (insideRect(x, z, HOUSE_FOOTPRINT)) {
    if (!insideRect(x, z, DOOR_GAP) && !insideRect(x, z, INTERIOR_ROOM)) return true
  }
  return FURNITURE_BLOCKERS.some((rect) => insideRect(x, z, rect))
}

export function createHouse(scene, materials) {
  const house = new THREE.Group()

  // front wall built as three panels around the door opening, instead of a
  // solid box, so the house has an actual hollow interior behind the door
  const sideWallWidth = WALL_W / 2 - DOOR_WIDTH / 2
  for (const side of [-1, 1]) {
    const sideWall = addShadowMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(sideWallWidth, WALL_H, WALL_T),
        materials.wall,
      ),
    )
    sideWall.position.set(
      side * (DOOR_WIDTH / 2 + sideWallWidth / 2),
      WALL_H / 2,
      -WALL_T / 2,
    )
    house.add(sideWall)
  }

  const headerHeight = WALL_H - DOOR_HEIGHT
  const header = addShadowMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(DOOR_WIDTH, headerHeight, WALL_T),
      materials.wall,
    ),
  )
  header.position.set(0, DOOR_HEIGHT + headerHeight / 2, -WALL_T / 2)
  house.add(header)

  const interior = createInterior(house)

  // gable roof via extruded triangular profile
  const roofOverhangX = 0.5
  const roofOverhangZ = 0.5
  const roofPeak = 2.5
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
  chimney.position.set(3.0, WALL_H + 1.3, -5.6)
  house.add(chimney)

  // door casing: jambs + lintel around the opening, NOT a solid slab over
  // it — a solid box here would cover the doorway and block the view
  // through it no matter what the door itself is doing
  const JAMB_T = 0.12
  const FRAME_D = 0.08
  for (const side of [-1, 1]) {
    const jamb = addShadowMesh(
      new THREE.Mesh(
        new THREE.BoxGeometry(JAMB_T, DOOR_HEIGHT + JAMB_T, FRAME_D),
        materials.trim,
      ),
    )
    jamb.position.set(
      side * (DOOR_WIDTH / 2 + JAMB_T / 2),
      (DOOR_HEIGHT + JAMB_T) / 2,
      0,
    )
    house.add(jamb)
  }
  const lintel = addShadowMesh(
    new THREE.Mesh(
      new THREE.BoxGeometry(DOOR_WIDTH + JAMB_T * 2, JAMB_T, FRAME_D),
      materials.trim,
    ),
  )
  lintel.position.set(0, DOOR_HEIGHT + JAMB_T / 2, 0)
  house.add(lintel)

  const door = createDoor(materials)
  house.add(door.group)

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
  makeWindow(-3.3)
  makeWindow(3.3)

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
  return {
    house,
    door,
    interiorUpdate: interior.update,
    interactables: interior.interactables,
  }
}
