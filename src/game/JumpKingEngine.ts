import type {
  Player,
  Platform,
  JumpKingGameState,
  TetrisBlock,
  TetrominoType,
} from './jumpKingTypes'
import { TETROMINO_SHAPES, TETROMINO_COLORS, PLATFORM_COLORS } from './jumpKingTypes'

export class JumpKingEngine {
  private state: JumpKingGameState
  private onStateChange: ((state: JumpKingGameState) => void) | null = null
  private readonly GRAVITY = 0.5
  private readonly MAX_FALL_SPEED = 15
  private readonly JUMP_SPEED_MIN = -8
  private readonly JUMP_SPEED_MAX = -18
  private readonly MOVE_SPEED = 3
  private readonly BUILD_TIME = 5000 // 5초
  private readonly BLOCK_SIZE = 30
  private readonly CANVAS_WIDTH = 400
  private readonly CANVAS_HEIGHT = 600
  
  private currentTetromino: {
    type: TetrominoType
    shape: number[][]
    x: number
    y: number
    color: string
  } | null = null

  constructor() {
    this.state = this.createInitialState()
  }

  private createInitialState(): JumpKingGameState {
    return {
      player: {
        x: 185,
        y: 550,
        width: 30,
        height: 30,
        velocityX: 0,
        velocityY: 0,
        isGrounded: false,
        isJumping: false,
        jumpPower: 0,
        direction: 'none',
      },
      platforms: this.generateFloorPlatforms(0),
      currentFloor: 0,
      targetFloor: 10,
      score: 0,
      fallDistance: 0,
      perfectJumps: 0,
      phase: 'intro',
      buildTimeLeft: this.BUILD_TIME,
      gameTime: 0,
    }
  }

  private generateFloorPlatforms(floorNumber: number): Platform[] {
    // 시작 플랫폼 (바닥)
    if (floorNumber === 0) {
      return [
        {
          x: 0,
          y: this.CANVAS_HEIGHT - 20,
          width: this.CANVAS_WIDTH,
          height: 20,
          type: 'normal',
          color: PLATFORM_COLORS.normal,
        },
      ]
    }
    return []
  }

  public getState(): JumpKingGameState {
    return { ...this.state }
  }

  public setOnStateChange(callback: (state: JumpKingGameState) => void) {
    this.onStateChange = callback
  }

  private emitStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.getState())
    }
  }

  public startBuilding() {
    if (this.state.phase === 'intro' || this.state.phase === 'jumping' || this.state.phase === 'complete' || this.state.phase === 'gameover') {
      this.state.phase = 'building'
      this.state.buildTimeLeft = this.BUILD_TIME
      this.spawnTetromino()
      this.emitStateChange()
    }
  }

  private spawnTetromino() {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    const type = types[Math.floor(Math.random() * types.length)]
    this.currentTetromino = {
      type,
      shape: TETROMINO_SHAPES[type],
      x: Math.floor(this.CANVAS_WIDTH / 2 / this.BLOCK_SIZE) - 1,
      y: 0,
      color: TETROMINO_COLORS[type],
    }
  }

  public moveTetromino(direction: 'left' | 'right') {
    if (!this.currentTetromino || this.state.phase !== 'building') return

    const newX = direction === 'left' ? this.currentTetromino.x - 1 : this.currentTetromino.x + 1
    
    // 경계 체크
    const maxX = Math.floor(this.CANVAS_WIDTH / this.BLOCK_SIZE) - this.currentTetromino.shape[0].length
    if (newX >= 0 && newX <= maxX) {
      this.currentTetromino.x = newX
      this.emitStateChange()
    }
  }

  public rotateTetromino() {
    if (!this.currentTetromino || this.state.phase !== 'building') return

    const rotated = this.currentTetromino.shape[0].map((_, index) =>
      this.currentTetromino!.shape.map((row) => row[index]).reverse()
    )

    this.currentTetromino.shape = rotated
    this.emitStateChange()
  }

  public dropTetromino() {
    if (!this.currentTetromino || this.state.phase !== 'building') return

    // 테트로미노를 플랫폼으로 변환
    const shape = this.currentTetromino.shape
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = (this.currentTetromino.x + col) * this.BLOCK_SIZE
          const y = (this.currentTetromino.y + row) * this.BLOCK_SIZE + 100 // 위쪽 영역에 배치
          
          this.state.platforms.push({
            x,
            y,
            width: this.BLOCK_SIZE,
            height: this.BLOCK_SIZE,
            type: 'normal',
            color: this.currentTetromino.color,
          })
        }
      }
    }

    // 다음 테트로미노 생성
    this.spawnTetromino()
    this.emitStateChange()
  }

  public update(deltaTime: number) {
    this.state.gameTime += deltaTime

    if (this.state.phase === 'intro') {
      // 인트로 화면에서는 업데이트 없음
    } else if (this.state.phase === 'building') {
      this.updateBuilding(deltaTime)
    } else if (this.state.phase === 'jumping') {
      this.updatePlayer(deltaTime)
      this.checkCollisions()
      this.checkGameState()
    }

    this.emitStateChange()
  }

  private updateBuilding(deltaTime: number) {
    this.state.buildTimeLeft -= deltaTime
    
    if (this.state.buildTimeLeft <= 0) {
      this.state.phase = 'jumping'
      this.currentTetromino = null
    }
  }

  private updatePlayer(deltaTime: number) {
    const player = this.state.player

    // 중력 적용
    if (!player.isGrounded) {
      player.velocityY += this.GRAVITY
      if (player.velocityY > this.MAX_FALL_SPEED) {
        player.velocityY = this.MAX_FALL_SPEED
      }
    }

    // 위치 업데이트
    player.x += player.velocityX
    player.y += player.velocityY

    // 화면 경계 체크
    if (player.x < 0) player.x = 0
    if (player.x + player.width > this.CANVAS_WIDTH) {
      player.x = this.CANVAS_WIDTH - player.width
    }

    // 바닥 아래로 떨어지면 게임 오버
    if (player.y > this.CANVAS_HEIGHT) {
      this.state.phase = 'gameover'
    }
  }

  private checkCollisions() {
    const player = this.state.player
    let isGrounded = false

    for (const platform of this.state.platforms) {
      // 플랫폼과의 충돌 체크
      if (
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + player.height > platform.y &&
        player.y + player.height < platform.y + platform.height + 10 &&
        player.velocityY >= 0
      ) {
        player.y = platform.y - player.height
        player.velocityY = 0
        isGrounded = true
        break
      }
    }

    player.isGrounded = isGrounded
  }

  private checkGameState() {
    // 목표 높이 도달 체크 (플레이어가 타워 상단 y < 100 에 도달)
    if (this.state.player.y < 100 && this.state.player.velocityY <= 0) {
      this.state.currentFloor++
      if (this.state.currentFloor >= this.state.targetFloor) {
        this.state.phase = 'complete'
      } else {
        // 다음 층: 플레이어를 바닥으로 리셋 후 빌딩 페이즈
        this.resetPlayerToBottom()
        this.state.phase = 'building'
        this.state.buildTimeLeft = this.BUILD_TIME
        this.spawnTetromino()
      }
    }
  }

  private resetPlayerToBottom() {
    const p = this.state.player
    p.x = 185
    p.y = this.CANVAS_HEIGHT - 20 - p.height
    p.velocityX = 0
    p.velocityY = 0
    p.isGrounded = true
    p.isJumping = false
    p.jumpPower = 0
    p.direction = 'none'
  }

  public startJump() {
    if (this.state.phase !== 'jumping' || !this.state.player.isGrounded) return
    
    this.state.player.isJumping = true
    this.state.player.jumpPower = 0
  }

  public chargeJump(deltaTime: number) {
    if (!this.state.player.isJumping || !this.state.player.isGrounded) return

    this.state.player.jumpPower += deltaTime * 0.05
    if (this.state.player.jumpPower > 100) {
      this.state.player.jumpPower = 100
    }
  }

  public releaseJump() {
    if (!this.state.player.isJumping || !this.state.player.isGrounded) return

    const power = this.state.player.jumpPower / 100
    const jumpSpeed = this.JUMP_SPEED_MIN + (this.JUMP_SPEED_MAX - this.JUMP_SPEED_MIN) * power

    this.state.player.velocityY = jumpSpeed
    
    // 방향에 따라 수평 속도 추가
    if (this.state.player.direction === 'left') {
      this.state.player.velocityX = -this.MOVE_SPEED * power
    } else if (this.state.player.direction === 'right') {
      this.state.player.velocityX = this.MOVE_SPEED * power
    }

    this.state.player.isJumping = false
    this.state.player.jumpPower = 0
    this.state.player.isGrounded = false
  }

  public setDirection(direction: 'left' | 'right' | 'none') {
    this.state.player.direction = direction
  }

  public reset() {
    this.state = this.createInitialState()
    this.emitStateChange()
  }

  /** 인트로 후 게임 시작 (빌딩 페이즈) */
  public startGame() {
    this.startBuilding()
  }

  public getCurrentTetromino() {
    return this.currentTetromino
  }
}
