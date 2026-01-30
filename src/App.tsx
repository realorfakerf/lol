import { useState, useRef, useEffect } from 'react'
import { TetrisCanvas } from './components/TetrisCanvas'
import { GameUI } from './components/GameUI'
import type { GameState, GameMode } from './game/types'
import { TetrisEngine } from './game/TetrisEngine'
import './App.css'

const BGM_VIDEO_ID = 'U0TXIXTzJEY' // https://www.youtube.com/watch?v=U0TXIXTzJEY

interface GameSettings {
  dropSpeed: number // 블록 낙하 속도 (1-10, 높을수록 빠름)
  moveSensitivity: number // 이동 감도 (1-10, 높을수록 빠름)
  targetHeight: number // 건물 목표 층 수 (5~50)
  bgmEnabled: boolean // BGM 소리 켜기/끄기
}

function App() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    player1: TetrisEngine.createInitialPlayerState(),
    player2: TetrisEngine.createInitialPlayerState(),
    phase: 'welcome',
    winner: null,
    targetHeight: 50,
    gameTime: 0,
    mode: 'local',
  })
  const [showInstructions, setShowInstructions] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<GameSettings>({
    dropSpeed: 5, // 기본값 (500ms)
    moveSensitivity: 5, // 기본값
    targetHeight: 50, // 건물 목표 층 수 (5~50)
    bgmEnabled: false, // BGM 기본 꺼짐 (사용자가 켜면 재생)
  })
  const ytPlayerRef = useRef<{ mute(): void; unMute(): void; playVideo(): void } | null>(null)
  const ytReadyRef = useRef(false)

  const handleGameStateChange = (state: GameState) => {
    setGameState(state)
  }

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode)
    setGameState({
      ...gameState,
      mode: mode,
      targetHeight: settings.targetHeight,
    })
  }

  const handleBackToModeSelect = () => {
    setSelectedMode(null)
    setGameState({
      ...gameState,
      phase: 'welcome',
    })
  }

  // YouTube BGM 플레이어 초기화
  useEffect(() => {
    if (ytReadyRef.current) return
    const initPlayer = () => {
      if (typeof window === 'undefined' || !window.YT?.Player) return false
      const el = document.getElementById('yt-bgm-player')
      if (!el) return false
      try {
        const player = new window.YT.Player('yt-bgm-player', {
          videoId: BGM_VIDEO_ID,
          width: 1,
          height: 1,
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: BGM_VIDEO_ID,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady(event: { target: { mute(): void; unMute(): void; playVideo(): void } }) {
              event.target.mute()
              event.target.playVideo()
              ytPlayerRef.current = event.target
              ytReadyRef.current = true
            },
          },
        })
        if (player && typeof (player as { mute?: () => void }).mute === 'function') {
          ytPlayerRef.current = player as { mute(): void; unMute(): void; playVideo(): void }
          ytReadyRef.current = true
        }
      } catch {
        return false
      }
      return true
    }
    if (initPlayer()) return
    const t = setInterval(() => {
      if (initPlayer()) clearInterval(t)
    }, 300)
    return () => clearInterval(t)
  }, [])

  // BGM 소리 on/off 동기화
  useEffect(() => {
    const player = ytPlayerRef.current
    if (!player) return
    try {
      if (settings.bgmEnabled) {
        player.unMute()
        player.playVideo()
      } else {
        player.mute()
      }
    } catch {
      // ignore
    }
  }, [settings.bgmEnabled])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black relative overflow-hidden">
      {/* YouTube BGM (숨김 재생) */}
      <div
        id="yt-bgm-player"
        className="fixed -left-[9999px] top-0 w-px h-px overflow-hidden"
        aria-hidden
      />

      {/* 전략 게임 스타일 배경 효과 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(59,130,246,0.05)_49%,rgba(59,130,246,0.05)_51%,transparent_52%)] bg-[length:20px_20px]"></div>
      </div>

      {/* 전략 게임 스타일 테두리 */}
      <div className="absolute inset-0 border-4 border-blue-500/30 pointer-events-none">
        <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-blue-400"></div>
        <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-blue-400"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-blue-400"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-blue-400"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-6 px-4">
        {/* 헤더 - 제목 하나로 통합 */}
        <div className="text-center mb-6 relative">
          <div className="inline-block relative">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 mb-2 tracking-wider drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              TETRIS BUILDING RACE
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
          </div>
        </div>

        {/* 설정 버튼 - 좌측 상단 */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => setShowSettings(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg border-2 border-purple-400/50 transform transition hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">⚙️</span>
            <span>Settings</span>
          </button>
        </div>

        {/* 설명 버튼 - 우측 상단 */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowInstructions(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg shadow-lg border-2 border-blue-400/50 transform transition hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">ℹ️</span>
            <span>Help</span>
          </button>
        </div>

        {/* 모드 선택 화면 - 로컬 모드만 */}
        {!selectedMode && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <h2 className="text-4xl font-bold text-blue-400 mb-8">SELECT GAME MODE</h2>
            <div className="grid grid-cols-1 gap-6 w-full max-w-md">
              <button
                onClick={() => handleModeSelect('local')}
                className="group relative p-8 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-2 border-blue-500/50 rounded-lg hover:border-blue-400 hover:from-blue-600/40 hover:to-cyan-600/40 transform transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                <div className="relative z-10">
                  <div className="text-5xl mb-4">👥</div>
                  <h3 className="text-2xl font-bold text-blue-300 mb-2">Local Mode</h3>
                  <p className="text-gray-300 text-sm">Play with 2 players on one keyboard</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 게임 영역 */}
        {selectedMode && (
          <div className="flex flex-col items-center gap-6">
            {/* 모드 표시 및 뒤로가기 버튼 */}
            <div className="w-full max-w-7xl flex justify-between items-center mb-4">
              <button
                onClick={handleBackToModeSelect}
                className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold rounded-lg shadow-lg border-2 border-gray-500/50 transform transition hover:scale-105 active:scale-95"
              >
                ← Back
              </button>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border-2 border-blue-500/50 rounded-lg">
                <span className="text-blue-300 font-bold">Mode: Local</span>
              </div>
            </div>

            <TetrisCanvas 
              onGameStateChange={handleGameStateChange} 
              settings={settings}
              gameMode="local"
              targetHeight={gameState.targetHeight}
              onBackToMain={handleBackToModeSelect}
            />
            <GameUI gameState={gameState} />
          </div>
        )}

        {/* 하단 정보 */}
        <div className="mt-6 text-center text-gray-500 text-xs font-mono">
          <p>REACT + TYPESCRIPT + HTML5 CANVAS</p>
        </div>
      </div>

      {/* 설명 모달 */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/50 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-blue-400">게임 설명</h2>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 text-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-3">🎯 Game Goal</h3>
                  <p className="text-lg">Clear lines to build your tower first! Reach height 50 to win.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
                    <h4 className="text-lg font-bold text-blue-300 mb-2">Player 1</h4>
                    <ul className="space-y-1 text-sm">
                      <li><strong>A/D:</strong> Move left/right</li>
                      <li><strong>S:</strong> Fast drop</li>
                      <li><strong>W:</strong> Rotate</li>
                      <li><strong>Shift:</strong> Instant drop</li>
                      <li><strong>Q:</strong> Save/Swap block</li>
                    </ul>
                  </div>

                  <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/30">
                    <h4 className="text-lg font-bold text-red-300 mb-2">Player 2</h4>
                    <ul className="space-y-1 text-sm">
                      <li><strong>←/→:</strong> Move left/right</li>
                      <li><strong>↓:</strong> Fast drop</li>
                      <li><strong>↑:</strong> Rotate</li>
                      <li><strong>Enter:</strong> Instant drop</li>
                      <li><strong>0:</strong> Save/Swap block</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-3">📋 Game Rules</h3>
                  <ul className="space-y-2 text-lg">
                    <li>✅ Clear lines to build your tower</li>
                    <li>⚠️ Many empty spaces make tower lower</li>
                    <li>⏱️ Slow line clearing makes tower lower</li>
                    <li>🏆 First to reach height 50 wins!</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/50 rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-purple-400">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 text-gray-200">
                {/* BGM 소리 켜기/끄기 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-lg font-bold text-purple-300">BGM</label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.bgmEnabled}
                      onClick={() => setSettings((s) => ({ ...s, bgmEnabled: !s.bgmEnabled }))}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${settings.bgmEnabled ? 'bg-purple-500' : 'bg-gray-600'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${settings.bgmEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">
                    소리 {settings.bgmEnabled ? '켜짐' : '꺼짐'} ·{' '}
                    <a
                      href={`https://www.youtube.com/watch?v=${BGM_VIDEO_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:underline"
                    >
                      YouTube BGM 링크
                    </a>
                  </p>
                </div>

                {/* 건물 층 수 설정 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-lg font-bold text-purple-300">건물 층 수</label>
                    <span className="text-xl font-bold text-white">{settings.targetHeight}층</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={settings.targetHeight}
                    onChange={(e) => setSettings({ ...settings, targetHeight: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5층</span>
                    <span>50층</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    목표 건물 높이 (이 층에 먼저 도달한 플레이어가 승리)
                  </p>
                </div>

                {/* 속도 조절 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-lg font-bold text-purple-300">Drop Speed</label>
                    <span className="text-xl font-bold text-white">{settings.dropSpeed}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.dropSpeed}
                    onChange={(e) => setSettings({ ...settings, dropSpeed: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    How fast blocks fall down
                  </p>
                </div>

                {/* 감도 조절 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-lg font-bold text-purple-300">Move Speed</label>
                    <span className="text-xl font-bold text-white">{settings.moveSensitivity}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.moveSensitivity}
                    onChange={(e) => setSettings({ ...settings, moveSensitivity: parseInt(e.target.value) })}
                    className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    How fast blocks move left and right
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
