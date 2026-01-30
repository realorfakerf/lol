// Jump King 게임 타입 정의

export interface Player {
  x: number
  y: number
  width: number
  height: number
  velocityX: number
  velocityY: number
  isGrounded: boolean
  isJumping: boolean
  jumpPower: number // 0-100
  direction: 'left' | 'right' | 'none'
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  type: 'normal' | 'ice' | 'bounce' | 'crumble' | 'gold'
  color: string
  isCrumbling?: boolean
  crumbleTimer?: number
}

export interface JumpKingGameState {
  player: Player
  platforms: Platform[]
  currentFloor: number
  targetFloor: number
  score: number
  fallDistance: number
  perfectJumps: number
  phase: 'intro' | 'building' | 'jumping' | 'falling' | 'complete' | 'gameover'
  buildTimeLeft: number
  gameTime: number
}

export interface TetrisBlock {
  x: number
  y: number
  type: TetrominoType
  color: string
}

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
}

export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
}

export const PLATFORM_COLORS = {
  normal: '#4CAF50',
  ice: '#00BCD4',
  bounce: '#4CAF50',
  crumble: '#9E9E9E',
  gold: '#FFD700',
}
