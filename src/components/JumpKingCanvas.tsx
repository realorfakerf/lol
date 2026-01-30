import { useEffect, useRef, useState } from 'react'
import { JumpKingEngine } from '../game/JumpKingEngine'
import type { JumpKingGameState } from '../game/jumpKingTypes'

interface JumpKingCanvasProps {
  onBackToMain?: () => void
}

export function JumpKingCanvas({ onBackToMain }: JumpKingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<JumpKingEngine | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [gameState, setGameState] = useState<JumpKingGameState | null>(null)
  const lastTimeRef = useRef<number>(Date.now())
  const keysPressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 게임 인스턴스 생성
    const game = new JumpKingEngine()
    gameRef.current = game
    game.setOnStateChange((state) => {
      setGameState(state)
    })
    // 인트로 상태로 시작 → 사용자가 "시작하기" 누르면 game.startGame() 호출

    // 게임 루프
    const gameLoop = () => {
      const currentTime = Date.now()
      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      game.update(deltaTime)
      render(ctx, game)

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()

    // 키보드 이벤트
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key)
      
      const state = game.getState()

      if (state.phase === 'intro') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          game.startGame()
        }
        return
      }
      if (state.phase === 'building') {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault()
        if (e.key === 'ArrowLeft') game.moveTetromino('left')
        if (e.key === 'ArrowRight') game.moveTetromino('right')
        if (e.key === 'ArrowUp') game.rotateTetromino()
        if (e.key === ' ' || e.key === 'ArrowDown') game.dropTetromino()
      } else if (state.phase === 'jumping') {
        if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
        if (e.key === ' ' && !e.repeat) {
          game.startJump()
        }
        if (e.key === 'ArrowLeft') game.setDirection('left')
        if (e.key === 'ArrowRight') game.setDirection('right')
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key)
      
      const state = game.getState()
      
      if (state.phase === 'jumping') {
        if (e.key === ' ') {
          game.releaseJump()
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          game.setDirection('none')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    const game = gameRef.current
    if (!game || !keysPressed.current.has(' ')) return

    const interval = setInterval(() => {
      game.chargeJump(16)
    }, 16)

    return () => clearInterval(interval)
  }, [gameState?.player.isJumping])

  const render = (ctx: CanvasRenderingContext2D, game: JumpKingEngine) => {
    const state = game.getState()
    const canvas = ctx.canvas

    // 배경
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 그리드
    ctx.strokeStyle = '#2a2a3e'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // 플랫폼 그리기
    state.platforms.forEach((platform) => {
      ctx.fillStyle = platform.color
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      ctx.strokeStyle = '#000'
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)
    })

    // 플레이어 그리기
    const player = state.player
    ctx.fillStyle = '#ff6b6b'
    ctx.fillRect(player.x, player.y, player.width, player.height)
    ctx.strokeStyle = '#000'
    ctx.strokeRect(player.x, player.y, player.width, player.height)

    // 눈 그리기
    ctx.fillStyle = '#fff'
    ctx.fillRect(player.x + 8, player.y + 8, 5, 5)
    ctx.fillRect(player.x + 17, player.y + 8, 5, 5)

    // 현재 테트로미노 그리기 (빌딩 페이즈)
    if (state.phase === 'building') {
      const tetromino = game.getCurrentTetromino()
      if (tetromino) {
        const blockSize = 30
        tetromino.shape.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (cell) {
              const x = (tetromino.x + colIndex) * blockSize
              const y = (tetromino.y + rowIndex) * blockSize + 100
              ctx.fillStyle = tetromino.color
              ctx.fillRect(x, y, blockSize, blockSize)
              ctx.strokeStyle = '#000'
              ctx.strokeRect(x, y, blockSize, blockSize)
            }
          })
        })
      }
    }

    // 점프 파워 게이지
    if (state.player.isJumping && state.player.isGrounded) {
      const gaugeWidth = 100
      const gaugeHeight = 10
      const gaugeX = canvas.width / 2 - gaugeWidth / 2
      const gaugeY = canvas.height - 50

      // 배경
      ctx.fillStyle = '#333'
      ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight)

      // 파워
      ctx.fillStyle = `hsl(${state.player.jumpPower * 1.2}, 100%, 50%)`
      ctx.fillRect(gaugeX, gaugeY, gaugeWidth * (state.player.jumpPower / 100), gaugeHeight)

      // 테두리
      ctx.strokeStyle = '#fff'
      ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight)
    }

    // UI 텍스트
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    
    if (state.phase === 'intro') {
      // 인트로는 오버레이에서 안내
    } else if (state.phase === 'building') {
      ctx.fillText(`Building Phase - Time: ${Math.ceil(state.buildTimeLeft / 1000)}s`, 10, 30)
      ctx.fillText('↑: Rotate  ←→: Move  Space: Drop', 10, 50)
    } else if (state.phase === 'jumping') {
      ctx.fillText(`Floor: ${state.currentFloor} / ${state.targetFloor}`, 10, 30)
      ctx.fillText('Space: Jump (Hold to charge)  ←→: Direction', 10, 50)
    }

    ctx.fillText(`Score: ${state.score}`, 10, canvas.height - 20)

    // 게임 상태 메시지
    if (state.phase === 'complete') {
      renderCenterMessage(ctx, 'VICTORY!', 'You reached the top!', '#4CAF50')
    } else if (state.phase === 'gameover') {
      renderCenterMessage(ctx, 'GAME OVER', 'You fell!', '#f44336')
    }
  }

  const renderCenterMessage = (
    ctx: CanvasRenderingContext2D,
    title: string,
    subtitle: string,
    color: string
  ) => {
    const canvas = ctx.canvas

    // 반투명 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 제목
    ctx.fillStyle = color
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20)

    // 부제
    ctx.fillStyle = '#fff'
    ctx.font = '20px Arial'
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 20)

    // 재시작 안내
    ctx.font = '16px Arial'
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 60)
  }

  const handleRestart = () => {
    if (gameRef.current) {
      gameRef.current.reset()
    }
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleRestart()
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [])

  const isIntro = gameState?.phase === 'intro'

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="border-4 border-blue-500/50 rounded-lg shadow-2xl bg-slate-900"
        />
        {/* Tower Climb 모드 설명 오버레이 (진입 시) */}
        {isIntro && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-lg p-6 text-center border-4 border-orange-500/50">
            <h3 className="text-2xl font-bold text-orange-300 mb-4">🏔️ Tower Climb</h3>
            <p className="text-gray-200 text-sm mb-4 max-w-sm">
              <strong className="text-cyan-400">1단계 빌딩</strong>: 제한 시간 안에 테트로미노를 쌓아 타워를 만드세요.
              <br /><br />
              <strong className="text-yellow-400">2단계 점프</strong>: 스페이스바를 누르고 있으면 점프 파워가 차오릅니다. 방향키(←→)로 방향을 정한 뒤 스페이스바를 놓으면 점프합니다.
              <br /><br />
              <strong className="text-green-400">목표</strong>: 타워 꼭대기(y &lt; 100)까지 올라가면 다음 층. {gameState?.targetFloor ?? 10}층까지 도달하면 승리! 바닥으로 떨어지면 게임 오버.
            </p>
            <p className="text-gray-400 text-xs mb-4">↑ 회전  ←→ 이동  스페이스 드롭 (빌딩) / 점프 차지 (점프)</p>
            <button
              type="button"
              onClick={() => gameRef.current?.startGame()}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg shadow-lg border-2 border-orange-400/50 transform transition hover:scale-105 active:scale-95"
            >
              시작하기
            </button>
          </div>
        )}
      </div>

      {/* 게임 정보 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/50 rounded-lg p-4 w-96">
        <h3 className="text-xl font-bold text-blue-400 mb-3">TETRIS TOWER CLIMB</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Phase:</span>
            <span className="font-bold text-cyan-400">
              {gameState?.phase === 'intro' && '📖 Intro'}
              {gameState?.phase === 'building' && '🏗️ Building'}
              {gameState?.phase === 'jumping' && '🦘 Jumping'}
              {gameState?.phase === 'complete' && '🎉 Complete'}
              {gameState?.phase === 'gameover' && '💀 Game Over'}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Floor:</span>
            <span className="font-bold text-yellow-400">
              {gameState?.currentFloor} / {gameState?.targetFloor}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Perfect Jumps:</span>
            <span className="font-bold text-green-400">{gameState?.perfectJumps}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={handleRestart}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg transform transition hover:scale-105 active:scale-95"
          >
            🔄 Restart
          </button>
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold rounded-lg transform transition hover:scale-105 active:scale-95"
            >
              ← Back to Menu
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
