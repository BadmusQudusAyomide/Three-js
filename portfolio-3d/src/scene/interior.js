import * as THREE from 'three'
import { addShadowMesh } from '../utils/shadow.js'
import {
  WALL_W as INTERIOR_W,
  WALL_H as INTERIOR_H,
  WALL_D as INTERIOR_D,
  WALL_T,
  WALL_CLEARANCE,
} from './houseDimensions.js'
import { createFireplace } from './fireplace.js'
import { createCeilingFan } from './ceilingFan.js'
import { createWallClock } from './wallClock.js'
import { createRugTexture } from '../utils/canvasTexture.js'

// walkable interior floor area, inset from the wall shell. minZ/minX/maxX
// get an extra WALL_CLEARANCE so the camera can't walk right up to touching
// a solid wall; maxZ doesn't need it — that edge is the open doorway, not
// a wall
export const INTERIOR_ROOM = {
  minX: -INTERIOR_W / 2 + WALL_T + WALL_CLEARANCE,
  maxX: INTERIOR_W / 2 - WALL_T - WALL_CLEARANCE,
  minZ: -INTERIOR_D + WALL_T + WALL_CLEARANCE,
  maxZ: -0.15,
}

// solid furniture pieces the walk controls should treat like walls, so you
// go around the sofa/table/shelf instead of walking through them
export const FURNITURE_BLOCKERS = []

function addBlocker(x, z, w, d) {
  FURNITURE_BLOCKERS.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
  })
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
  const backWallZ = -INTERIOR_D + WALL_T / 2
  const leftWallX = -INTERIOR_W / 2 + WALL_T / 2
  const rightWallX = INTERIOR_W / 2 - WALL_T / 2

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
  backWall.position.set(0, INTERIOR_H / 2, backWallZ)
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

  // === lighting =============================================================

  // no shadow casting here: this light sits close to the ceiling in a tight
  // room and shadow-mapping it produces acne that reads as the whole
  // interior being unlit, which defeats the point of a room light
  const pendantLight = new THREE.PointLight(0xffcf9e, 10, 16, 1.6)
  pendantLight.position.set(0, INTERIOR_H - 0.5, -4.2)
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

  // === furniture materials ==================================================

  const fabricMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d5a7a,
    roughness: 0.95,
  })
  const cushionMaterial = new THREE.MeshStandardMaterial({
    color: 0x7d6a8a,
    roughness: 0.9,
  })
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f2a1a,
    roughness: 0.5,
  })
  const woodLightMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a6440,
    roughness: 0.55,
  })
  const rugMaterial = new THREE.MeshStandardMaterial({
    map: createRugTexture(),
    roughness: 1,
  })
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.4,
    metalness: 0.7,
  })
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0f16,
    emissive: 0x2f5f8f,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  })
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2418,
    roughness: 0.6,
  })
  const canvasMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9a876,
    roughness: 0.9,
  })
  const potMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a4632,
    roughness: 0.8,
  })
  const foliageMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f6b34,
    roughness: 1,
  })

  // === rug ===================================================================

  const rug = addShadowMesh(
    new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.6), rugMaterial),
    { cast: false },
  )
  rug.rotation.x = -Math.PI / 2
  rug.position.set(0, 0.03, -4.3)
  house.add(rug)

  // === sofa (3-seat, facing the TV / back wall) ============================

  const sofaZ = -2.9
  const sofaGroup = new THREE.Group()
  const seatBase = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 0.9), fabricMaterial),
  )
  seatBase.position.set(0, 0.25, 0)
  sofaGroup.add(seatBase)

  const backrest = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 0.22), fabricMaterial),
  )
  backrest.position.set(0, 0.62, -0.35)
  sofaGroup.add(backrest)

  for (const side of [-1, 1]) {
    const arm = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.9), fabricMaterial),
    )
    arm.position.set(side * 1.3, 0.4, 0)
    sofaGroup.add(arm)
  }

  for (let i = -1; i <= 1; i++) {
    const cushion = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.18, 0.8), cushionMaterial),
    )
    cushion.position.set(i * 0.85, 0.48, 0.02)
    sofaGroup.add(cushion)
  }

  for (const lx of [-1.15, 0, 1.15]) {
    const leg = addShadowMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6), woodMaterial),
    )
    leg.position.set(lx, 0.09, 0.35)
    sofaGroup.add(leg)
  }

  sofaGroup.position.set(0, 0, sofaZ)
  house.add(sofaGroup)
  addBlocker(0, sofaZ, 2.8, 1.1)

  // === coffee table ==========================================================

  const tableZ = -4.5
  const tableGroup = new THREE.Group()
  const tableTop = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.7), woodLightMaterial),
  )
  tableTop.position.set(0, 0.42, 0)
  tableGroup.add(tableTop)
  for (const lx of [-0.55, 0.55]) {
    for (const lz of [-0.28, 0.28]) {
      const leg = addShadowMesh(
        new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.05), woodMaterial),
      )
      leg.position.set(lx, 0.21, lz)
      tableGroup.add(leg)
    }
  }
  tableGroup.position.set(0, 0, tableZ)
  house.add(tableGroup)
  addBlocker(0, tableZ, 1.5, 0.9)

  // === TV console + TV against the back wall ================================

  const consoleZ = backWallZ + 0.35
  const consoleGroup = new THREE.Group()
  const consoleBody = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 0.5), woodMaterial),
  )
  consoleBody.position.set(0, 0.3, 0)
  consoleGroup.add(consoleBody)

  const tvScreen = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 0.06), screenMaterial),
    { cast: false },
  )
  tvScreen.position.set(0, 1.25, -0.15)
  consoleGroup.add(tvScreen)

  const tvStandNeck = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), metalMaterial),
  )
  tvStandNeck.position.set(0, 0.8, -0.15)
  consoleGroup.add(tvStandNeck)

  // subtle purple accent strip under the console — a small cool contrast to
  // the warm firelight/pendant, not a neon wash of the whole room
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0x120a1c,
    emissive: 0x8a4fe0,
    emissiveIntensity: 1.4,
    roughness: 0.5,
  })
  const ledStrip = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.03, 0.06), ledMaterial),
    { cast: false },
  )
  ledStrip.position.set(0, 0.03, 0.2)
  consoleGroup.add(ledStrip)
  const ledLight = new THREE.PointLight(0x8a4fe0, 1.4, 2.2, 2)
  ledLight.position.set(0, 0.05, 0.3)
  consoleGroup.add(ledLight)

  consoleGroup.position.set(0, 0, consoleZ)
  house.add(consoleGroup)
  addBlocker(0, consoleZ, 2.5, 0.6)

  // placeholder power toggle — the real intro content lands in a later
  // phase, this just proves the interaction system end to end
  let tvOn = true
  function toggleTv() {
    tvOn = !tvOn
    screenMaterial.emissiveIntensity = tvOn ? 0.9 : 0
    screenMaterial.color.set(tvOn ? 0x0a0f16 : 0x030303)
  }

  // === bookshelf against the left wall =======================================

  const shelfX = leftWallX + 0.3
  const shelfZ = -6.0
  const shelfGroup = new THREE.Group()
  const shelfCarcass = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.9, 1.6), woodMaterial),
  )
  shelfCarcass.position.set(0, 0.95, 0)
  shelfGroup.add(shelfCarcass)
  for (let i = 1; i < 4; i++) {
    const shelfBoard = addShadowMesh(
      new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 1.55), woodLightMaterial),
      { cast: false },
    )
    shelfBoard.position.set(0, i * 0.45, 0)
    shelfGroup.add(shelfBoard)
  }
  // a few books as flat colored slabs so the shelf doesn't read as empty
  const bookColors = [0x8a3b34, 0x3f5f6b, 0x6b5a3f, 0x4b6b3f]
  for (let row = 1; row <= 2; row++) {
    let bx = -0.55
    for (let i = 0; i < 5; i++) {
      const bw = 0.09 + (i % 3) * 0.02
      const bh = 0.28 + (i % 2) * 0.05
      const book = addShadowMesh(
        new THREE.Mesh(
          new THREE.BoxGeometry(0.15, bh, bw),
          new THREE.MeshStandardMaterial({
            color: bookColors[i % bookColors.length],
            roughness: 0.8,
          }),
        ),
        { cast: false },
      )
      book.position.set(0, row * 0.45 + bh / 2 + 0.02, bx)
      shelfGroup.add(book)
      bx += bw + 0.02
    }
  }
  shelfGroup.rotation.y = Math.PI / 2
  shelfGroup.position.set(shelfX, 0, shelfZ)
  house.add(shelfGroup)
  addBlocker(shelfX, shelfZ, 1.7, 0.5)

  // === floor lamp beside the sofa ============================================

  const lampX = 1.7
  const lampZ = sofaZ + 0.3
  const lampGroup = new THREE.Group()
  const lampPole = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), metalMaterial),
  )
  lampPole.position.set(0, 0.65, 0)
  lampGroup.add(lampPole)
  const lampBase = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12), metalMaterial),
  )
  lampBase.position.set(0, 0.02, 0)
  lampGroup.add(lampBase)
  const lampShadeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0dfc0,
    emissive: 0xffcf9e,
    emissiveIntensity: 0.8,
    roughness: 0.7,
  })
  const lampShade = addShadowMesh(
    new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.34, 16, 1, true), lampShadeMaterial),
    { cast: false },
  )
  lampShade.position.set(0, 1.42, 0)
  lampGroup.add(lampShade)
  const lampLight = new THREE.PointLight(0xffcf9e, 2.5, 4, 1.8)
  lampLight.position.set(0, 1.35, 0)
  lampGroup.add(lampLight)

  lampGroup.position.set(lampX, 0, lampZ)
  house.add(lampGroup)

  // === wall art on the right wall =============================================

  const artGroup = new THREE.Group()
  const artFrame = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.75), frameMaterial),
    { cast: false },
  )
  artGroup.add(artFrame)
  const artCanvas = addShadowMesh(
    new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.86, 0.61), canvasMaterial),
    { cast: false },
  )
  artCanvas.position.x = 0.02
  artGroup.add(artCanvas)
  // the canvas is offset toward local +x (in front of the frame backing);
  // rotate 180° so that faces -x, into the room, instead of into the wall
  artGroup.rotation.y = Math.PI
  artGroup.position.set(rightWallX - 0.11, 2.0, -2.2)
  house.add(artGroup)

  // === potted plant in the back-left corner ==================================

  const plantX = leftWallX + 0.55
  const plantZ = backWallZ + 0.55
  const plantGroup = new THREE.Group()
  const pot = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.32, 12), potMaterial),
  )
  pot.position.set(0, 0.16, 0)
  plantGroup.add(pot)
  const fronds = []
  for (let i = 0; i < 5; i++) {
    const frond = addShadowMesh(
      new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 6), foliageMaterial),
      { cast: false },
    )
    const angle = (i / 5) * Math.PI * 2
    frond.position.set(Math.cos(angle) * 0.08, 0.6, Math.sin(angle) * 0.08)
    const baseZ = Math.cos(angle) * 0.25
    const baseX = Math.sin(angle) * 0.25
    frond.rotation.z = baseZ
    frond.rotation.x = baseX
    plantGroup.add(frond)
    fronds.push({ mesh: frond, baseX, baseZ, phase: i * 1.3 })
  }
  plantGroup.position.set(plantX, 0, plantZ)
  house.add(plantGroup)
  addBlocker(plantX, plantZ, 0.5, 0.5)

  // === fireplace on the right wall, mirroring the bookshelf =================

  const fireplaceX = rightWallX - 0.25
  const fireplaceZ = -6.0
  const fireplace = createFireplace(house, fireplaceX, fireplaceZ)
  addBlocker(fireplaceX, fireplaceZ, 0.6, 1.7)

  // === ceiling fan ============================================================

  const fan = createCeilingFan(house, 0, INTERIOR_H - 0.15, -2.0)

  // === wall clock, real local time ===========================================

  const clock = createWallClock(house, rightWallX - 0.11, 2.0, -1.2, Math.PI)

  function update(t, dt) {
    fireplace.update(t)
    fan.update(dt)
    clock.update()

    for (const f of fronds) {
      const sway = Math.sin(t * 0.8 + f.phase) * 0.08
      f.mesh.rotation.z = f.baseZ + sway
      f.mesh.rotation.x = f.baseX + Math.cos(t * 0.7 + f.phase) * 0.06
    }
  }

  // proof-of-concept interactables for the click-to-interact system — the
  // real TV intro / laptop / bookshelf content lands in later phases
  const interactables = [
    {
      object: consoleGroup,
      label: 'Click to turn the TV on/off',
      onInteract: toggleTv,
      maxDistance: 3.5,
    },
    {
      object: fireplace.group,
      label: 'Click to light/put out the fire',
      onInteract: fireplace.toggle,
      maxDistance: 3,
    },
  ]

  return { update, interactables }
}
