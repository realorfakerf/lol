import type { Tetromino, TetrominoType, PlayerState } from './types'
import { TETROMINOS, COLORS } from './types'

// 보드 크기
export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

// 게임 설정
export const TARGET_BUILDING_HEIGHT = 50
export const BUILDING_DECAY_RATE = 0.5 // 초당 감소량
export const SPEED_PENALTY_THRESHOLD = 3000 // 3초
export const EMPTY_SPACE_PENALTY_RATE = 0.02 // 빈칸당 감소율

export class TetrisEngine {
  // 빈 보드 생성
  static createEmptyBoard(): number[][] {
    return Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0))
  }

  // 랜덤 테트로미노 생성
  static createRandomTetromino(): Tetromino {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    const type = types[Math.floor(Math.random() * types.length)]
    const shape = TETROMINOS[type]
    
    return {
      type,
      shape,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
      color: COLORS[type],
    }
  }

  // 초기 플레이어 상태 생성
  static createInitialPlayerState(): PlayerState {
    const currentPiece = this.createRandomTetromino()
    const nextPiece = this.createRandomTetromino()
    
    // 다음 블록이 현재 블록과 겹치지 않도록 위치 조정
    nextPiece.x = BOARD_WIDTH + 2 // 보드 오른쪽에 배치
    nextPiece.y = 2
    
    return {
      board: this.createEmptyBoard(),
      currentPiece: currentPiece,
      nextPiece: nextPiece,
      savedPiece: null,
      canSwap: true,
      score: 0,
      linesCleared: 0,
      buildingHeight: 0,
      lastLineClearTime: Date.now(),
      emptySpacesCount: 0,
      isGameOver: false,
    }
  }

  // 블록이 보드에 충돌하는지 확인
  static checkCollision(board: number[][], piece: Tetromino, offsetX = 0, offsetY = 0): boolean {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + offsetX
          const newY = piece.y + y + offsetY

          // 경계 체크 (천장을 뚫었는지 확인 - 이동 중에는 y=0 허용)
          if (newX < 0 || newX >= BOARD_WIDTH || newY < 0 || newY >= BOARD_HEIGHT) {
            return true
          }

          // 보드와 충돌 체크
          if (board[newY][newX]) {
            return true
          }
        }
      }
    }
    return false
  }

  // 블록 회전
  static rotatePiece(piece: Tetromino): Tetromino {
    const newShape = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    )
    return { ...piece, shape: newShape }
  }

  // 블록을 보드에 고정
  static lockPiece(board: number[][], piece: Tetromino): number[][] {
    const newBoard = board.map(row => [...row])
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y
          const boardX = piece.x + x
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = 1
          }
        }
      }
    }
    
    return newBoard
  }

  // 완성된 줄 찾기 및 제거
  static clearLines(board: number[][]): { newBoard: number[][], linesCleared: number } {
    let linesCleared = 0
    const newBoard = board.filter(row => {
      const isFull = row.every(cell => cell === 1)
      if (isFull) linesCleared++
      return !isFull
    })

    // 제거된 줄만큼 위에 빈 줄 추가
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0))
    }

    return { newBoard, linesCleared }
  }

  // 빈칸 개수 계산
  static countEmptySpaces(board: number[][]): number {
    let count = 0
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        if (board[y][x] === 0) {
          // 위에 블록이 있는지 확인 (갇힌 빈칸)
          let hasBlockAbove = false
          for (let checkY = y - 1; checkY >= 0; checkY--) {
            if (board[checkY][x] === 1) {
              hasBlockAbove = true
              break
            }
          }
          if (hasBlockAbove) {
            count++
          }
        }
      }
    }
    return count
  }

  // 블록을 즉시 아래로 떨어뜨리기 (하드 드롭)
  static hardDrop(board: number[][], piece: Tetromino): Tetromino {
    let newPiece = { ...piece }
    while (!this.checkCollision(board, newPiece, 0, 1)) {
      newPiece.y++
    }
    return newPiece
  }
}
