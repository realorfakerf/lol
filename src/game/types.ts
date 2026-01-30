// 테트리스 블록 타입
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

// 테트리스 블록 모양 정의
export const TETROMINOS: Record<TetrominoType, number[][]> = {
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

// 건축 자재별 색상 (나무, 철, 유리)
export const COLORS: Record<TetrominoType, string> = {
  I: '#8B6914',   // 나무 (진한)
  O: '#A07828',   // 나무 (중간)
  T: '#6B4E0E',   // 나무 (어두운)
  S: '#5C5C5C',   // 철 (진한)
  Z: '#707070',   // 철 (중간)
  J: '#484848',   // 철 (어두운)
  L: '#7EC8E3',   // 유리
}

/** 건축 자재 라벨 (나무 / 철 / 유리) */
export const MATERIAL_LABELS: Record<TetrominoType, string> = {
  I: '나무',
  O: '나무',
  T: '나무',
  S: '철',
  Z: '철',
  J: '철',
  L: '유리',
}

// 테트로미노 조각
export interface Tetromino {
  type: TetrominoType
  shape: number[][]
  x: number
  y: number
  color: string
}

// 플레이어 번호
export type PlayerNumber = 1 | 2

// 플레이어 상태
export interface PlayerState {
  board: number[][] // 0은 빈칸, 1은 채워진 칸
  currentPiece: Tetromino | null
  nextPiece: Tetromino | null
  savedPiece: Tetromino | null // 저장된 블록
  canSwap: boolean // 저장/교환 가능 여부 (한 번 저장하면 다음 블록이 떨어질 때까지 교환 불가)
  score: number
  linesCleared: number
  buildingHeight: number
  lastLineClearTime: number
  emptySpacesCount: number
  isGameOver: boolean
}

// 게임 단계
export type GamePhase = 'welcome' | 'playing' | 'paused' | 'finished'

// 게임 모드 (로컬 2인용만)
export type GameMode = 'local'

// 게임 상태
export interface GameState {
  player1: PlayerState
  player2: PlayerState
  phase: GamePhase
  winner: PlayerNumber | null
  targetHeight: number
  gameTime: number
  mode: GameMode
}
