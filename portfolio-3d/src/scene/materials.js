import * as THREE from 'three'

export function createMaterials() {
  return {
    grass: new THREE.MeshStandardMaterial({ color: 0x4c7a3f, roughness: 1 }),
    path: new THREE.MeshStandardMaterial({ color: 0xb8a98c, roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xe9dcc4, roughness: 0.85 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xf5ead2, roughness: 0.7 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x8a3a2b, roughness: 0.7 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x4a2e1f, roughness: 0.6 }),
    door: new THREE.MeshStandardMaterial({ color: 0x5c3320, roughness: 0.5 }),
    // semi-transparent so the yard is visible through it from inside —
    // the room shouldn't feel boxed in — while still reading as a warm,
    // lit window from outside
    glassLit: new THREE.MeshStandardMaterial({
      color: 0x2c2a1c,
      emissive: 0xffb35c,
      emissiveIntensity: 1.1,
      roughness: 0.3,
      transparent: true,
      opacity: 0.55,
    }),
    stone: new THREE.MeshStandardMaterial({ color: 0x8d867a, roughness: 0.95 }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x2b2b2b,
      roughness: 0.4,
      metalness: 0.7,
    }),
    lantern: new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      emissive: 0xffb35c,
      emissiveIntensity: 1.8,
      roughness: 0.4,
    }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x3f6b34, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x4a3221, roughness: 1 }),
    chimney: new THREE.MeshStandardMaterial({ color: 0x9a6a52, roughness: 0.9 }),
  }
}
