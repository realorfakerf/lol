import { useEffect, useRef, useState } from 'react'
import { TetrisBuildingGame } from '../game/TetrisBuildingGame'
import type { GameState, GameMode, PlayerState, Tetromino } from '../game/types'
import { BOARD_WIDTH, BOARD_HEIGHT } from '../game/TetrisEngine'

interface GameSettings {
  dropSpeed: number
  moveSensitivity: number
  targetHeight?: number
}

interface TetrisCanvasProps {
  onGameStateChange: (state: GameState) => void
  settings: GameSettings
  gameMode: GameMode
  targetHeight?: number
  onBackToMain?: () => void
}

export function TetrisCanvas({ onGameStateChange, settings, gameMode, targetHeight = 50, onBackToMain }: TetrisCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<TetrisBuildingGame | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [gamePhase, setGamePhase] = useState<'welcome' | 'playing' | 'paused' | 'finished'>('welcome')
  const lastBuildingHeight1Ref = useRef(0)
  const lastBuildingHeight2Ref = useRef(0)
  const flashUntil1Ref = useRef(0)
  const flashUntil2Ref = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 게임 인스턴스가 이미 있으면 재생성하지 않음
    // 모드가 변경되거나 목표 층 수가 변경되면 새 게임 인스턴스 생성
    const currentTarget = gameRef.current?.getState().targetHeight
    if (!gameRef.current || gameRef.current.getState().mode !== gameMode || currentTarget !== targetHeight) {
      const game = new TetrisBuildingGame(gameMode, targetHeight)
      gameRef.current = game
      game.setOnStateChange((state) => {
        onGameStateChange(state)
        setGamePhase(state.phase)
      })
    }
    
    const game = gameRef.current
    
    // 설정 적용
    game.updateSettings(settings)

    // 캔버스 크기 설정
    const CELL_SIZE = 20
    const PADDING = 20
    const BUILDING_WIDTH = 150
    const PREVIEW_WIDTH = 80 // 다음 블록/저장 블록 미리보기 영역
    const TETRIS_WIDTH = BOARD_WIDTH * CELL_SIZE
    const TETRIS_HEIGHT = BOARD_HEIGHT * CELL_SIZE
    
    canvas.width = TETRIS_WIDTH * 2 + BUILDING_WIDTH * 2 + PREVIEW_WIDTH * 2 + PADDING * 7
    canvas.height = TETRIS_HEIGHT + PADDING * 2

    // 키보드 입력 처리
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = game.getState()
      
      // 게임 플레이 중일 때만 조작 가능
      if (state.phase !== 'playing') return

      // Player 1 controls (WASD + Shift + Q)
      switch (e.key.toLowerCase()) {
        case 'a':
          game.movePlayer(1, 'left')
          e.preventDefault()
          break
        case 'd':
          game.movePlayer(1, 'right')
          e.preventDefault()
          break
        case 's':
          game.movePlayer(1, 'down')
          e.preventDefault()
          break
        case 'w':
          game.rotatePlayer(1)
          e.preventDefault()
          break
        case 'q':
          game.swapPiece(1)
          e.preventDefault()
          break
      }
      
      // Shift key for Player 1 hard drop
      if (e.key === 'Shift') {
        game.hardDropPlayer(1)
        e.preventDefault()
      }

      // Player 2 controls (Arrow keys + Enter + Right Shift)
      switch (e.key) {
        case 'ArrowLeft':
          game.movePlayer(2, 'left')
          e.preventDefault()
          break
        case 'ArrowRight':
          game.movePlayer(2, 'right')
          e.preventDefault()
          break
        case 'ArrowDown':
          game.movePlayer(2, 'down')
          e.preventDefault()
          break
        case 'ArrowUp':
          game.rotatePlayer(2)
          e.preventDefault()
          break
        case 'Enter':
          game.hardDropPlayer(2)
          e.preventDefault()
          break
      }
      
      // Right Shift for Player 2 swap
      if (e.key === 'Shift' && e.shiftKey && !e.ctrlKey && !e.altKey) {
        // Shift 키만 눌렀을 때는 Player 1의 하드 드롭
        // Player 2는 다른 키 조합 필요 (예: Ctrl+Shift 또는 별도 키)
      }
      
      // Player 2 swap (Ctrl 키 사용)
      if (e.key === 'Control' || (e.ctrlKey && e.key === 'Shift')) {
        // 실제로는 별도 키가 필요하지만, 일단 0 키로 설정
      }
      
      // Player 2 swap - 숫자 0 키 사용
      if (e.key === '0') {
        game.swapPiece(2)
        e.preventDefault()
      }

      // Pause
      if (e.key === 'Escape') {
        game.togglePause()
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // 게임 렌더링
    const render = () => {
      const state = game.getState()
      const now = Date.now()
      const FLASH_DURATION = 280

      // 건물 높이 증가 시 플래시 효과 트리거
      if (state.player1.buildingHeight > lastBuildingHeight1Ref.current) {
        flashUntil1Ref.current = now + FLASH_DURATION
      }
      lastBuildingHeight1Ref.current = state.player1.buildingHeight
      if (state.player2.buildingHeight > lastBuildingHeight2Ref.current) {
        flashUntil2Ref.current = now + FLASH_DURATION
      }
      lastBuildingHeight2Ref.current = state.player2.buildingHeight

      const flashActive1 = now < flashUntil1Ref.current
      const flashActive2 = now < flashUntil2Ref.current

      // 배경 그리기
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Player 1 영역
      const p1TetrisX = PADDING + PREVIEW_WIDTH
      const p1BuildingX = p1TetrisX + TETRIS_WIDTH + PADDING
      const p1PreviewX = PADDING
      
      // Player 2 영역
      const p2BuildingX = p1BuildingX + BUILDING_WIDTH + PADDING
      const p2TetrisX = p2BuildingX + BUILDING_WIDTH + PADDING
      const p2PreviewX = p2TetrisX + TETRIS_WIDTH + PADDING

      // 플레이어 1 그리기
      drawPlayer(ctx, state.player1, p1TetrisX, PADDING, p1BuildingX, p1PreviewX, CELL_SIZE, '플레이어 1', '#4ecdc4', state.targetHeight, flashActive1)
      
      // 플레이어 2 그리기
      drawPlayer(ctx, state.player2, p2TetrisX, PADDING, p2BuildingX, p2PreviewX, CELL_SIZE, '플레이어 2', '#ff6b6b', state.targetHeight, flashActive2)

      // 게임 오버 오버레이 (개별 플레이어)
      if (state.player1.isGameOver && state.phase === 'playing') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(p1TetrisX, PADDING, TETRIS_WIDTH, TETRIS_HEIGHT)
        ctx.fillStyle = '#ff0000'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', p1TetrisX + TETRIS_WIDTH / 2, PADDING + TETRIS_HEIGHT / 2)
      }

      if (state.player2.isGameOver && state.phase === 'playing') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(p2TetrisX, PADDING, TETRIS_WIDTH, TETRIS_HEIGHT)
        ctx.fillStyle = '#ff0000'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', p2TetrisX + TETRIS_WIDTH / 2, PADDING + TETRIS_HEIGHT / 2)
      }

      // 승자 표시
      if (state.phase === 'finished' && state.winner) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 우승 배경 효과
        const winnerColor = state.winner === 1 ? '#4ecdc4' : '#ff6b6b'
        ctx.fillStyle = winnerColor
        ctx.globalAlpha = 0.15
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 1
        
        // 트로피와 승자 텍스트
        ctx.fillStyle = '#ffd700'
        ctx.font = 'bold 72px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('🏆', canvas.width / 2, canvas.height / 2 - 100)
        
        ctx.fillStyle = winnerColor
        ctx.font = 'bold 64px Arial'
        ctx.fillText(
          '전북인공지능고등학교 화이팅!!',
          canvas.width / 2,
          canvas.height / 2 - 40
        )
        
        ctx.font = 'bold 28px Arial'
        ctx.fillStyle = 'rgba(253, 224, 71, 0.9)'
        ctx.fillText(
          '이동훈 대표님 화이팅!!',
          canvas.width / 2,
          canvas.height / 2 + 5
        )
        
        ctx.font = 'bold 48px Arial'
        ctx.fillStyle = winnerColor
        ctx.fillText(
          `Player ${state.winner} Wins!`,
          canvas.width / 2,
          canvas.height / 2 + 45
        )
        
        ctx.fillStyle = '#ffffff'
        ctx.font = '20px Arial'
        const winner = state.winner === 1 ? state.player1 : state.player2
        ctx.fillText(
          `Final Height: ${Math.floor(winner.buildingHeight)} | Lines: ${winner.linesCleared}`,
          canvas.width / 2,
          canvas.height / 2 + 95
        )
      } else if (state.phase === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = '#ffeb3b'
        ctx.font = 'bold 56px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('⏸️ 일시정지 ⏸️', canvas.width / 2, canvas.height / 2 - 20)
        
        ctx.fillStyle = '#ffffff'
        ctx.font = '24px Arial'
        ctx.fillText('ESC를 눌러 계속하기', canvas.width / 2, canvas.height / 2 + 40)
      }
    }

    // 게임 루프
    const gameLoop = () => {
      game.update()
      render()
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [onGameStateChange, gameMode, targetHeight]) // 게임 루프, 모드/목표층 변경 시 재생성

  // 설정 변경 시 게임에 적용
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.updateSettings(settings)
    }
  }, [settings])

  const handleStartGame = () => {
    if (gameRef.current) {
      gameRef.current.start()
    }
  }

  const handleRestart = () => {
    if (gameRef.current) {
      gameRef.current.reset()
    }
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border-2 border-blue-500/50 rounded-lg shadow-2xl bg-slate-900/50"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* 시작 화면 - 슈팅 전략 게임 스타일 */}
      {gamePhase === 'welcome' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-black/95 backdrop-blur-sm rounded-lg pointer-events-auto border-2 border-blue-500/30">
          <div className="text-center max-w-2xl px-8 relative">
            {/* 전략 게임 스타일 장식 */}
            <div className="absolute -top-4 -left-4 w-16 h-16 border-t-2 border-l-2 border-blue-400/50"></div>
            <div className="absolute -top-4 -right-4 w-16 h-16 border-t-2 border-r-2 border-blue-400/50"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 border-b-2 border-l-2 border-blue-400/50"></div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 border-b-2 border-r-2 border-blue-400/50"></div>

            <p className="text-4xl md:text-5xl font-black mb-8 font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 via-orange-300 to-amber-500 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
              BUILD YOUR EMPIRE
            </p>
            <button
              onClick={handleStartGame}
              className="px-16 py-5 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:via-cyan-500 hover:to-blue-500 text-white text-3xl font-black rounded-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] transform transition hover:scale-110 active:scale-95 border-2 border-blue-400/50 tracking-wider relative overflow-hidden"
            >
              <span className="relative z-10">START MISSION</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
            </button>
            <p className="text-sm text-gray-500 mt-6 font-mono">
              PRESS TO BEGIN
            </p>
          </div>
        </div>
      )}
      
      {/* 승리 화면 오버레이 (게임 종료 시) */}
      {gamePhase === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 rounded-lg pointer-events-auto">
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 mb-4">
                전북인공지능고등학교 화이팅!!
              </h2>
              <p className="text-xl text-yellow-200/90 font-semibold mb-3">
                이동훈 대표님 화이팅!!
              </p>
              <p className="text-2xl text-white font-bold">
                Player {gameRef.current?.getState().winner} Wins!
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-2xl font-bold rounded-xl shadow-2xl transform transition hover:scale-110 active:scale-95 border-2 border-blue-400/50"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => {
                  if (gameRef.current) {
                    gameRef.current.reset()
                  }
                  if (onBackToMain) {
                    onBackToMain()
                  }
                }}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-2xl font-bold rounded-xl shadow-2xl transform transition hover:scale-110 active:scale-95 border-2 border-purple-400/50"
              >
                🏠 Back to Main
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 플레이어 그리기 함수
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  tetrisX: number,
  tetrisY: number,
  buildingX: number,
  previewX: number,
  cellSize: number,
  name: string,
  color: string,
  targetHeight: number,
  flashActive?: boolean
) {
  // 테트리스 보드 배경
  ctx.fillStyle = '#0f0f1e'
  ctx.fillRect(tetrisX, tetrisY, BOARD_WIDTH * cellSize, BOARD_HEIGHT * cellSize)
  
  // 그리드 그리기
  ctx.strokeStyle = '#2a2a3e'
  ctx.lineWidth = 1
  for (let y = 0; y <= BOARD_HEIGHT; y++) {
    ctx.beginPath()
    ctx.moveTo(tetrisX, tetrisY + y * cellSize)
    ctx.lineTo(tetrisX + BOARD_WIDTH * cellSize, tetrisY + y * cellSize)
    ctx.stroke()
  }
  for (let x = 0; x <= BOARD_WIDTH; x++) {
    ctx.beginPath()
    ctx.moveTo(tetrisX + x * cellSize, tetrisY)
    ctx.lineTo(tetrisX + x * cellSize, tetrisY + BOARD_HEIGHT * cellSize)
    ctx.stroke()
  }

  // 보드에 있는 블록 그리기
  for (let y = 0; y < player.board.length; y++) {
    for (let x = 0; x < player.board[y].length; x++) {
      if (player.board[y][x]) {
        ctx.fillStyle = '#666'
        ctx.fillRect(
          tetrisX + x * cellSize + 1,
          tetrisY + y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        )
      }
    }
  }

  // 현재 블록 그리기
  if (player.currentPiece) {
    drawTetromino(ctx, player.currentPiece, tetrisX, tetrisY, cellSize)
  }

  // 플레이어 이름
  ctx.fillStyle = color
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(name, tetrisX + (BOARD_WIDTH * cellSize) / 2, tetrisY - 5)

  // 건물 그리기 (플레이어별 문구 표시, 건축 시 플래시 효과)
  const isPlayer1 = name === '플레이어 1'
  const isPlayer2 = name === '플레이어 2'
  drawBuilding(ctx, player, buildingX, tetrisY, 150, BOARD_HEIGHT * cellSize, color, targetHeight, isPlayer1, isPlayer2, flashActive)
  
  // 미리보기 영역 그리기 (다음 블록 & 저장된 블록)
  drawPreviewArea(ctx, player, previewX, tetrisY, cellSize, color)
}

// 미리보기 영역 그리기 (다음 블록 & 저장된 블록)
function drawPreviewArea(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  previewX: number,
  tetrisY: number,
  cellSize: number,
  color: string
) {
  const PREVIEW_WIDTH = 80
  const PREVIEW_HEIGHT = 120
  
  // 저장된 블록 영역
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(previewX, tetrisY, PREVIEW_WIDTH, PREVIEW_HEIGHT / 2 - 5)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(previewX, tetrisY, PREVIEW_WIDTH, PREVIEW_HEIGHT / 2 - 5)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('SAVED', previewX + PREVIEW_WIDTH / 2, tetrisY + 12)
  
  if (player.savedPiece) {
    const savedPiece = { ...player.savedPiece }
    savedPiece.x = Math.floor((PREVIEW_WIDTH / cellSize - savedPiece.shape[0].length) / 2)
    savedPiece.y = 2
    drawTetromino(ctx, savedPiece, previewX, tetrisY + 15, cellSize)
  } else {
    ctx.fillStyle = '#444'
    ctx.font = '10px Arial'
    ctx.fillText('(없음)', previewX + PREVIEW_WIDTH / 2, tetrisY + 40)
  }
  
  // 다음 블록 영역
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(previewX, tetrisY + PREVIEW_HEIGHT / 2 + 5, PREVIEW_WIDTH, PREVIEW_HEIGHT / 2 - 5)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(previewX, tetrisY + PREVIEW_HEIGHT / 2 + 5, PREVIEW_WIDTH, PREVIEW_HEIGHT / 2 - 5)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('NEXT', previewX + PREVIEW_WIDTH / 2, tetrisY + PREVIEW_HEIGHT / 2 + 17)
  
  if (player.nextPiece) {
    const nextPiece = { ...player.nextPiece }
    // 다음 블록은 이미 올바른 위치에 있지만, 미리보기 영역에 맞게 조정
    const previewOffsetX = Math.floor((PREVIEW_WIDTH / cellSize - nextPiece.shape[0].length) / 2)
    const previewOffsetY = tetrisY + PREVIEW_HEIGHT / 2 + 20
    drawTetromino(ctx, { ...nextPiece, x: previewOffsetX, y: 0 }, previewX, previewOffsetY, cellSize)
  }
}

// 테트로미노 그리기
function drawTetromino(
  ctx: CanvasRenderingContext2D,
  piece: Tetromino,
  offsetX: number,
  offsetY: number,
  cellSize: number
) {
  ctx.fillStyle = piece.color
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        ctx.fillRect(
          offsetX + (piece.x + x) * cellSize + 1,
          offsetY + (piece.y + y) * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        )
      }
    }
  }
}

// 건물 그리기 (현대적인 고층 건물 디자인)
function drawBuilding(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  targetHeight: number,
  isPlayer1?: boolean,
  isPlayer2?: boolean,
  flashActive?: boolean
) {
  // 건물 배경 (어두운 하늘)
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(x, y, width, height)
  
  // 목표 높이 표시 (금색 선)
  const targetY = y + height - 10
  ctx.strokeStyle = '#ffd700'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(x, targetY)
  ctx.lineTo(x + width, targetY)
  ctx.stroke()
  ctx.setLineDash([])

  // 건물 높이 계산
  const buildingHeight = Math.min(player.buildingHeight, targetHeight)
  const barHeight = (buildingHeight / targetHeight) * (height - 20)
  const buildingStartY = y + height - 10 - barHeight
  
  if (barHeight > 0) {
    // 건물 메인 구조
    const buildingX = x + 5
    const buildingWidth = width - 10
    
    // 건물 그라디언트 배경 (입체감)
    const gradient = ctx.createLinearGradient(buildingX, buildingStartY, buildingX + buildingWidth, buildingStartY)
    gradient.addColorStop(0, '#4a5568')
    gradient.addColorStop(0.5, '#718096')
    gradient.addColorStop(1, '#4a5568')
    ctx.fillStyle = gradient
    ctx.fillRect(buildingX, buildingStartY, buildingWidth, barHeight)
    
    // 건물 외곽선
    ctx.strokeStyle = '#2d3748'
    ctx.lineWidth = 2
    ctx.strokeRect(buildingX, buildingStartY, buildingWidth, barHeight)
    
    // 창문 격자 패턴
    const windowSize = 4
    const windowGap = 2
    const windowSpacing = windowSize + windowGap
    
    const rows = Math.floor(barHeight / windowSpacing)
    const cols = Math.floor(buildingWidth / windowSpacing)
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const windowX = buildingX + col * windowSpacing + windowGap
        const windowY = buildingStartY + row * windowSpacing + windowGap
        
        // 랜덤하게 일부 창문만 불 켜짐 (70% 확률)
        const isLit = (row + col * 3) % 10 < 7
        
        if (isLit) {
          // 켜진 창문 (밝은 노란색/흰색)
          const lightness = 0.6 + Math.sin((row + col) * 0.5) * 0.3
          ctx.fillStyle = `rgba(255, 255, 200, ${lightness})`
        } else {
          // 꺼진 창문 (어두운 파란색)
          ctx.fillStyle = 'rgba(30, 40, 70, 0.8)'
        }
        
        ctx.fillRect(windowX, windowY, windowSize, windowSize)
        
        // 창문 테두리
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(windowX, windowY, windowSize, windowSize)
      }
    }
    
    // 건물 지붕 (어두운 상단)
    if (barHeight > 10) {
      ctx.fillStyle = 'rgba(20, 30, 50, 0.9)'
      ctx.fillRect(buildingX, buildingStartY, buildingWidth, 8)
      
      // 지붕 라인
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(buildingX, buildingStartY + 8)
      ctx.lineTo(buildingX + buildingWidth, buildingStartY + 8)
      ctx.stroke()
    }
    
    // 측면 음영 (입체감)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(buildingX + buildingWidth - 5, buildingStartY, 5, barHeight)
    
    // 왼쪽 하이라이트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(buildingX, buildingStartY, 3, barHeight)

    // 건축 시 플래시 효과 (높이 증가할 때마다 빛남)
    if (flashActive) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.fillRect(buildingX, buildingStartY, buildingWidth, barHeight)
      ctx.fillStyle = 'rgba(255, 235, 150, 0.25)'
      ctx.fillRect(buildingX, buildingStartY, buildingWidth, barHeight)
    }

    // 플레이어 1 건물에 학교명 표시 (세로, 매우 크게)
    const label = '전북인공지능 고등학교'
    const schoolFontSize = 26
    const schoolCharHeight = schoolFontSize + 2
    const schoolTextHeight = label.length * schoolCharHeight
    if (isPlayer1 && barHeight >= schoolTextHeight) {
      const startY = buildingStartY + (barHeight - schoolTextHeight) / 2 + schoolFontSize

      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${schoolFontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 3
      const centerX = x + width / 2
      for (let i = 0; i < label.length; i++) {
        ctx.fillText(label[i], centerX, startY + i * schoolCharHeight)
      }
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // 플레이어 2 건물에 문구 표시 (세로, 화려한 빛나는 효과)
    const label2 = '이동훈 대표님 수고하셨습니다!'
    const label2FontSize = 26
    const label2CharHeight = label2FontSize + 2
    const label2TextHeight = label2.length * label2CharHeight
    if (isPlayer2 && barHeight >= label2TextHeight) {
      const startY2 = buildingStartY + (barHeight - label2TextHeight) / 2 + label2FontSize
      const centerX = x + width / 2

      ctx.save()
      ctx.font = `bold ${label2FontSize}px Arial`
      ctx.textAlign = 'center'

      // 1단계: 황금빛 외곽 글로우 (넓은 번짐)
      ctx.shadowColor = 'rgba(255, 215, 0, 0.9)'
      ctx.shadowBlur = 18
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
      for (let i = 0; i < label2.length; i++) {
        ctx.fillText(label2[i], centerX, startY2 + i * label2CharHeight)
      }
      // 2단계: 흰색 할로우 (중간 번짐)
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
      ctx.shadowBlur = 8
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      for (let i = 0; i < label2.length; i++) {
        ctx.fillText(label2[i], centerX, startY2 + i * label2CharHeight)
      }
      // 3단계: 그라디언트 메인 텍스트 (황금 → 노랑 → 흰색 빛남)
      const gradY1 = buildingStartY
      const gradY2 = buildingStartY + barHeight
      const gradient = ctx.createLinearGradient(centerX, gradY1, centerX, gradY2)
      gradient.addColorStop(0, '#ffd700')
      gradient.addColorStop(0.35, '#fff8dc')
      gradient.addColorStop(0.5, '#ffffff')
      gradient.addColorStop(0.65, '#fffacd')
      gradient.addColorStop(1, '#ffd700')
      ctx.fillStyle = gradient
      ctx.shadowColor = 'rgba(255, 223, 0, 0.6)'
      ctx.shadowBlur = 4
      for (let i = 0; i < label2.length; i++) {
        ctx.fillText(label2[i], centerX, startY2 + i * label2CharHeight)
      }
      ctx.shadowBlur = 0
      ctx.restore()
    }
  }

  // 높이 텍스트 (건물 중앙에 크게)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 4
  ctx.fillText(
    `${Math.floor(player.buildingHeight)}`,
    x + width / 2,
    y + height / 2 - 10
  )
  ctx.shadowBlur = 0
  
  ctx.font = '14px Arial'
  ctx.fillStyle = '#ffd700'
  ctx.fillText(`/ ${targetHeight}`, x + width / 2, y + height / 2 + 10)

  // 상태 정보 (상단)
  ctx.font = '11px Arial'
  ctx.fillStyle = '#aaa'
  ctx.fillText(`줄: ${player.linesCleared}`, x + width / 2, y + 20)
  ctx.fillText(`빈칸: ${player.emptySpacesCount}`, x + width / 2, y + 35)

  // 게임오버 표시
  if (player.isGameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(x, y, width, height)
    ctx.fillStyle = '#ff0000'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('게임오버', x + width / 2, y + height / 2)
  }
}
