import * as THREE from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js'

export function createSky(scene) {
  const sky = new Sky()
  sky.scale.setScalar(450)
  scene.add(sky)

  const sunPosition = new THREE.Vector3()
  const elevation = 7
  const azimuth = 195
  const phi = THREE.MathUtils.degToRad(90 - elevation)
  const theta = THREE.MathUtils.degToRad(azimuth)
  sunPosition.setFromSphericalCoords(1, phi, theta)

  const skyUniforms = sky.material.uniforms
  skyUniforms.turbidity.value = 6
  skyUniforms.rayleigh.value = 2.2
  skyUniforms.mieCoefficient.value = 0.012
  skyUniforms.mieDirectionalG.value = 0.9
  skyUniforms.sunPosition.value.copy(sunPosition)

  scene.fog = new THREE.Fog(0xf2c69a, 16, 60)

  return { sunPosition }
}

export function createLights(scene, sunPosition) {
  const hemiLight = new THREE.HemisphereLight(0x9fb4d8, 0x3a2f28, 0.55)
  scene.add(hemiLight)

  const sunLight = new THREE.DirectionalLight(0xffcf9e, 2.4)
  sunLight.position.copy(sunPosition).multiplyScalar(60)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(2048, 2048)
  sunLight.shadow.camera.near = 10
  sunLight.shadow.camera.far = 120
  sunLight.shadow.camera.left = -18
  sunLight.shadow.camera.right = 18
  sunLight.shadow.camera.top = 18
  sunLight.shadow.camera.bottom = -18
  sunLight.shadow.bias = -0.0015
  scene.add(sunLight)
  scene.add(sunLight.target)
  sunLight.target.position.set(0, 1, -3)

  const porchLight = new THREE.PointLight(0xffb066, 6, 8, 2)
  porchLight.position.set(0, 2.6, 0.6)
  porchLight.castShadow = true
  scene.add(porchLight)

  return { hemiLight, sunLight, porchLight }
}
