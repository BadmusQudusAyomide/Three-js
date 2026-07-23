export function addShadowMesh(mesh, { cast = true, receive = true } = {}) {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
  return mesh
}
