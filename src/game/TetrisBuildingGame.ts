import type { GameState, GameMode, PlayerNumber, PlayerState } from './types'
import { 
  TetrisEngine, 
  BUILDING_DECAY_RATE,
  SPEED_PENALTY_THRESHOLD,
  EMPTY_SPACE_PENALTY_RATE,
  BOARD_WIDTH
} from './TetrisEngine'

interface GameSettings {
  dropSpeed: number // 1-10
  moveSensitivity: number // 1-10
}

export class TetrisBuildingGame {
  private gameState: GameState
  private lastUpdateTime: number
  private dropInterval: number = 500 // 0.5초마다 자동 낙하 (더 빠르게)
  private lastDropTime: number
  private onStateChange?: (state: GameState) => void
  private moveSensitivity: number = 5 // 이동 감도

  constructor(mode: GameMode = 'local', targetHeight: number = 50) {
    this.gameState = {
      player1: TetrisEngine.createInitialPlayerState(),
      player2: TetrisEngine.createInitialPlayerState(),
      phase: 'welcome',
      winner: null,
      targetHeight: Math.max(5, Math.min(50, targetHeight)),
      gameTime: 0,
      mode: mode,
    }
    this.lastUpdateTime = Date.now()
    this.lastDropTime = Date.now()
  }

  // 상태 변경 콜백 설정
  setOnStateChange(callback: (state: GameState) => void) {
    this.onStateChange = callback
  }

  // 설정 업데이트
  updateSettings(settings: GameSettings) {
    // dropSpeed: 1(느림) = 1000ms, 10(빠름) = 100ms
    // 공식: 1100 - (dropSpeed * 100)
    this.dropInterval = 1100 - (settings.dropSpeed * 100)
    this.moveSensitivity = settings.moveSensitivity
  }

  // 게임 시작
  start() {
    this.gameState.phase = 'playing'
    this.gameState.player1 = TetrisEngine.createInitialPlayerState()
    this.gameState.player2 = TetrisEngine.createInitialPlayerState()
    this.gameState.winner = null
    this.gameState.gameTime = 0
    this.lastUpdateTime = Date.now()
    this.lastDropTime = Date.now()
    this.notifyStateChange()
  }

  // 게임 일시정지
  togglePause() {
    if (this.gameState.phase === 'playing') {
      this.gameState.phase = 'paused'
      this.notifyStateChange()
    } else if (this.gameState.phase === 'paused') {
      this.gameState.phase = 'playing'
      this.notifyStateChange()
    }
  }

  // 환영 화면으로 돌아가기
  reset() {
    this.gameState.phase = 'welcome'
    this.gameState.player1 = TetrisEngine.createInitialPlayerState()
    this.gameState.player2 = TetrisEngine.createInitialPlayerState()
    this.gameState.winner = null
    this.notifyStateChange()
  }

  // 게임 상태 가져오기
  getState(): GameState {
    return this.gameState
  }

  // 플레이어 이동
  movePlayer(playerNumber: PlayerNumber, direction: 'left' | 'right' | 'down') {
    if (this.gameState.phase !== 'playing') return

    const player = playerNumber === 1 ? this.gameState.player1 : this.gameState.player2
    if (!player.currentPiece || player.isGameOver) return

    const offsetX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0
    const offsetY = direction === 'down' ? 1 : 0

    if (!TetrisEngine.checkCollision(player.board, player.currentPiece, offsetX, offsetY)) {
      player.currentPiece.x += offsetX
      player.currentPiece.y += offsetY
      this.notifyStateChange()
    } else if (direction === 'down') {
      this.lockPieceAndSpawnNew(player, playerNumber)
    }
  }

  // 블록 회전
  rotatePlayer(playerNumber: PlayerNumber) {
    if (this.gameState.phase !== 'playing') return

    const player = playerNumber === 1 ? this.gameState.player1 : this.gameState.player2
    if (!player.currentPiece || player.isGameOver) return

    const rotated = TetrisEngine.rotatePiece(player.currentPiece)
    if (!TetrisEngine.checkCollision(player.board, rotated)) {
      player.currentPiece = rotated
      this.notifyStateChange()
    }
  }

  // 하드 드롭
  hardDropPlayer(playerNumber: PlayerNumber) {
    if (this.gameState.phase !== 'playing') return

    const player = playerNumber === 1 ? this.gameState.player1 : this.gameState.player2
    if (!player.currentPiece || player.isGameOver) return

    player.currentPiece = TetrisEngine.hardDrop(player.board, player.currentPiece)
    this.lockPieceAndSpawnNew(player, playerNumber)
  }

  // 블록 저장/교환
  swapPiece(playerNumber: PlayerNumber) {
    if (this.gameState.phase !== 'playing') return

    const player = playerNumber === 1 ? this.gameState.player1 : this.gameState.player2
    if (!player.currentPiece || player.isGameOver || !player.canSwap) return

    // 저장된 블록이 없으면 현재 블록을 저장하고 다음 블록 사용
    if (!player.savedPiece) {
      // 현재 블록을 저장 (위치 초기화)
      const saved = { ...player.currentPiece }
      saved.x = 0
      saved.y = 0
      player.savedPiece = saved
      
      // 다음 블록을 현재 블록으로 (위치 초기화)
      player.currentPiece = { ...player.nextPiece }
      player.currentPiece.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.currentPiece.shape[0].length / 2)
      player.currentPiece.y = 0
      
      // 새로운 다음 블록 생성
      player.nextPiece = TetrisEngine.createRandomTetromino()
      player.nextPiece.x = BOARD_WIDTH + 2
      player.nextPiece.y = 2
      
      player.canSwap = false
    } else {
      // 저장된 블록과 현재 블록 교환
      const temp = player.currentPiece
      player.currentPiece = { ...player.savedPiece }
      player.currentPiece.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.currentPiece.shape[0].length / 2)
      player.currentPiece.y = 0
      
      player.savedPiece = { ...temp }
      player.savedPiece.x = 0
      player.savedPiece.y = 0
      
      player.canSwap = false
    }

    // 충돌 체크
    if (TetrisEngine.checkCollision(player.board, player.currentPiece)) {
      player.isGameOver = true
    }

    this.notifyStateChange()
  }

  // 블록 고정 및 새 블록 생성
  private lockPieceAndSpawnNew(player: PlayerState, playerNumber: PlayerNumber) {
    if (!player.currentPiece) return

    // 천장에 닿았는지 확인 (블록의 일부가 y <= 0에 있는지)
    let hitCeiling = false
    for (let y = 0; y < player.currentPiece.shape.length; y++) {
      for (let x = 0; x < player.currentPiece.shape[y].length; x++) {
        if (player.currentPiece.shape[y][x]) {
          const boardY = player.currentPiece.y + y
          // 천장(y=0)에 닿거나 천장을 뚫으면 게임 오버
          if (boardY <= 0) {
            hitCeiling = true
            break
          }
        }
      }
      if (hitCeiling) break
    }

    // 천장에 닿으면 게임 오버
    if (hitCeiling) {
      player.isGameOver = true
      this.checkGameEnd(playerNumber)
      this.notifyStateChange()
      return
    }

    // 블록 고정
    player.board = TetrisEngine.lockPiece(player.board, player.currentPiece)

    // 줄 제거 확인
    const { newBoard, linesCleared } = TetrisEngine.clearLines(player.board)
    player.board = newBoard
    player.linesCleared += linesCleared

    // 줄을 지웠을 때 건물 높이 증가
    if (linesCleared > 0) {
      player.buildingHeight += linesCleared * 2
      player.lastLineClearTime = Date.now()
      player.score += linesCleared * 100

      // 승리 조건 확인
      if (player.buildingHeight >= this.gameState.targetHeight) {
        this.gameState.winner = playerNumber
        this.gameState.phase = 'finished'
      }
    }

    // 빈칸 개수 업데이트
    player.emptySpacesCount = TetrisEngine.countEmptySpaces(player.board)

    // 새 블록 생성 (다음 블록을 현재로, 새로운 다음 블록 생성)
    player.currentPiece = { ...player.nextPiece }
    player.currentPiece.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.currentPiece.shape[0].length / 2)
    player.currentPiece.y = 0
    
    player.nextPiece = TetrisEngine.createRandomTetromino()
    player.nextPiece.x = BOARD_WIDTH + 2 // 보드 오른쪽에 배치 (겹치지 않게)
    player.nextPiece.y = 2
    
    // 저장/교환 가능하도록 설정
    player.canSwap = true

    // 게임 오버 체크 (새 블록이 충돌하면)
    if (player.currentPiece && TetrisEngine.checkCollision(player.board, player.currentPiece)) {
      player.isGameOver = true
      this.checkGameEnd(playerNumber)
    }

    this.notifyStateChange()
  }

  // 게임 종료 확인
  private checkGameEnd(playerNumber: PlayerNumber) {
    const player = playerNumber === 1 ? this.gameState.player1 : this.gameState.player2
    const otherPlayer = playerNumber === 1 ? this.gameState.player2 : this.gameState.player1

    // 한 플레이어가 게임 오버되면 나머지 플레이어가 승리
    if (player.isGameOver && !otherPlayer.isGameOver) {
      // 나머지 플레이어가 승리
      this.gameState.winner = playerNumber === 1 ? 2 : 1
      this.gameState.phase = 'finished'
    } else if (player.isGameOver && otherPlayer.isGameOver) {
      // 두 플레이어 모두 게임오버면 건물 높이로 승자 결정
      if (player.buildingHeight > otherPlayer.buildingHeight) {
        this.gameState.winner = playerNumber
      } else if (otherPlayer.buildingHeight > player.buildingHeight) {
        this.gameState.winner = playerNumber === 1 ? 2 : 1
      } else {
        // 동점이면 점수로 결정
        if (player.score > otherPlayer.score) {
          this.gameState.winner = playerNumber
        } else {
          this.gameState.winner = playerNumber === 1 ? 2 : 1
        }
      }
      this.gameState.phase = 'finished'
    }
  }

  // 게임 업데이트 (매 프레임마다 호출)
  update() {
    if (this.gameState.phase !== 'playing') return

    // 한 명이라도 게임 오버면 게임 종료 확인
    if (this.gameState.player1.isGameOver || this.gameState.player2.isGameOver) {
      if (this.gameState.player1.isGameOver) {
        this.checkGameEnd(1)
      }
      if (this.gameState.player2.isGameOver) {
        this.checkGameEnd(2)
      }
      if (this.gameState.phase === 'finished') {
        return
      }
    }

    const now = Date.now()
    const deltaTime = now - this.lastUpdateTime
    this.lastUpdateTime = now

    // 게임 시간 업데이트
    this.gameState.gameTime += deltaTime

    // 자동 낙하 (게임 오버된 플레이어는 제외)
    const timeSinceLastDrop = now - this.lastDropTime
    if (timeSinceLastDrop > this.dropInterval) {
      this.lastDropTime = now
      
      if (!this.gameState.player1.isGameOver && this.gameState.player1.currentPiece) {
        this.movePlayer(1, 'down')
      }
      if (!this.gameState.player2.isGameOver && this.gameState.player2.currentPiece) {
        this.movePlayer(2, 'down')
      }
    }

    // 건물 높이 감소 계산
    this.updateBuildingDecay(this.gameState.player1, this.gameState.player2, deltaTime)
    this.updateBuildingDecay(this.gameState.player2, this.gameState.player1, deltaTime)

    this.notifyStateChange()
  }

  // 건물 높이 감소 업데이트
  private updateBuildingDecay(player: PlayerState, opponent: PlayerState, deltaTime: number) {
    if (player.isGameOver) return

    let decay = 0

    // 1. 빈칸 페널티
    if (player.emptySpacesCount > 0) {
      decay += player.emptySpacesCount * EMPTY_SPACE_PENALTY_RATE * (deltaTime / 1000)
    }

    // 2. 속도 페널티 (상대보다 줄 지우는 속도가 느릴 때)
    const timeSinceLastClear = Date.now() - player.lastLineClearTime
    const opponentTimeSinceLastClear = Date.now() - opponent.lastLineClearTime
    
    if (timeSinceLastClear > SPEED_PENALTY_THRESHOLD && 
        timeSinceLastClear > opponentTimeSinceLastClear) {
      const speedDiff = (timeSinceLastClear - opponentTimeSinceLastClear) / 1000
      decay += speedDiff * BUILDING_DECAY_RATE * (deltaTime / 1000)
    }

    // 건물 높이 감소 적용
    if (decay > 0) {
      player.buildingHeight = Math.max(0, player.buildingHeight - decay)
    }
  }

  // 상태 변경 알림
  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.gameState)
    }
  }
}
