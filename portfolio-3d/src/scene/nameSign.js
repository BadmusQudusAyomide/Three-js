import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { addShadowMesh } from '../utils/shadow.js'

const BASE_Y = 0.02
const BOUNCE_SPEED = 1.6

// bounce starts tall on entrance and eases down to its resting height
const BOUNCE_HEIGHT_START = 1.1
const BOUNCE_HEIGHT_REST = 0.28
const BOUNCE_DECAY_RATE = 0.4

export function createNameSign(scene) {
  const nameMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3d9a4,
    roughness: 0.35,
    metalness: 0.15,
  })

  const nameLight = new THREE.SpotLight(0xfff1d6, 8, 10, Math.PI / 5, 0.5, 1.5)
  nameLight.position.set(4.2, 2.6, 4.4)
  scene.add(nameLight)
  scene.add(nameLight.target)

  let nameMesh = null
  let spawnTime = null

  new FontLoader().load('/fonts/helvetiker_bold.typeface.json', (font) => {
    const textGeometry = new TextGeometry('Badmus Qudus Ayomide', {
      font,
      size: 0.42,
      depth: 0.16,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 2,
    })
    // center on X/Z but keep the base sitting at y=0, so it stands on the lawn
    textGeometry.computeBoundingBox()
    const bbox = textGeometry.boundingBox
    textGeometry.translate(
      -(bbox.min.x + bbox.max.x) / 2,
      -bbox.min.y,
      -(bbox.min.z + bbox.max.z) / 2,
    )

    nameMesh = addShadowMesh(new THREE.Mesh(textGeometry, nameMaterial))
    nameMesh.position.set(4.3, BASE_Y, 2.6)
    nameMesh.rotation.y = -0.55
    scene.add(nameMesh)

    nameLight.target.position.set(4.3, BASE_Y, 2.6)
  })

  function update(t) {
    if (!nameMesh) return
    if (spawnTime === null) spawnTime = t

    const elapsed = t - spawnTime
    const amplitude =
      BOUNCE_HEIGHT_REST +
      (BOUNCE_HEIGHT_START - BOUNCE_HEIGHT_REST) *
        Math.exp(-BOUNCE_DECAY_RATE * elapsed)

    // classic squash-and-stretch: compressed at ground contact, stretched at the peak of the hop
    const bounce = Math.abs(Math.sin(t * BOUNCE_SPEED))
    nameMesh.position.y = BASE_Y + bounce * amplitude

    const stretch = THREE.MathUtils.lerp(0.82, 1.12, bounce)
    const squash = THREE.MathUtils.lerp(1.14, 0.95, bounce)
    nameMesh.scale.set(squash, stretch, squash)
  }

  return { update }
}
