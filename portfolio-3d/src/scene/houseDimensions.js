// shared shell dimensions — house.js (exterior shell) and interior.js (room
// contents) both need these to line up exactly, so they're defined once here
// instead of as separately-hand-kept constants in each file
export const WALL_W = 10
export const WALL_H = 3.9
export const WALL_D = 8
export const WALL_T = 0.15

// how far the walk-collision boundary is kept from a wall's actual surface.
// Without this, the camera's eye point can walk to touch-distance from a
// wall, and since the camera near-clip plane (0.1) is wider than the wall
// itself (0.15) at that range, the wall gets clipped away and you see
// straight through it to whatever is outside
export const WALL_CLEARANCE = 0.4
