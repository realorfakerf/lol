import type { GameState } from '../game/types'

interface GameUIProps {
  gameState: GameState
}

export function GameUI({ gameState }: GameUIProps) {
  return (
    <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-sm rounded-lg p-6 shadow-2xl border-2 border-blue-500/30">
      <div className="grid grid-cols-2 gap-6">
        {/* Player 1 Stats - 전략 게임 스타일 */}
        <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 p-5 rounded-lg border-2 border-blue-500/50 relative overflow-hidden">
          {/* 장식 코너 */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400/50"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400/50"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400/50"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400/50"></div>
          
          <h3 className="text-xl font-black text-blue-400 mb-4 tracking-wider relative z-10">PLAYER 1</h3>
          <div className="space-y-3 text-white relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-mono text-sm">SCORE:</span>
              <span className="font-bold text-lg">{gameState.player1.score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-mono text-sm">LINES:</span>
              <span className="font-bold text-lg">{gameState.player1.linesCleared}</span>
            </div>
            <div className="flex justify-between items-center border-t border-blue-500/30 pt-2">
              <span className="text-gray-400 font-mono text-sm">HEIGHT:</span>
              <span className="font-bold text-xl text-blue-400">
                {Math.floor(gameState.player1.buildingHeight)}/{gameState.targetHeight}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-mono text-sm">PENALTY:</span>
              <span className="font-bold text-red-400">{gameState.player1.emptySpacesCount}</span>
            </div>
            {gameState.player1.isGameOver && (
              <div className="text-red-500 font-black text-center mt-3 py-2 bg-red-900/30 rounded border border-red-500/50">
                MISSION FAILED
              </div>
            )}
          </div>
        </div>

        {/* Player 2 Stats - 전략 게임 스타일 */}
        <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 p-5 rounded-lg border-2 border-red-500/50 relative overflow-hidden">
          {/* 장식 코너 */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-400/50"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-400/50"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-400/50"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-400/50"></div>
          
          <h3 className="text-xl font-black text-red-400 mb-4 tracking-wider relative z-10">PLAYER 2</h3>
          <div className="space-y-3 text-white relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-mono text-sm">SCORE:</span>
              <span className="font-bold text-lg">{gameState.player2.score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-mono text-sm">LINES:</span>
              <span className="font-bold text-lg">{gameState.player2.linesCleared}</span>
            </div>
            <div className="flex justify-between items-center border-t border-red-500/30 pt-2">
              <span className="text-gray-400 font-mono text-sm">HEIGHT:</span>
              <span className="font-bold text-xl text-red-400">
                {Math.floor(gameState.player2.buildingHeight)}/{gameState.targetHeight}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-mono text-sm">PENALTY:</span>
              <span className="font-bold text-red-400">{gameState.player2.emptySpacesCount}</span>
            </div>
            {gameState.player2.isGameOver && (
              <div className="text-red-500 font-black text-center mt-3 py-2 bg-red-900/30 rounded border border-red-500/50">
                MISSION FAILED
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
