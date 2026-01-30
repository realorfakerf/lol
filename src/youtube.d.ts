/** YouTube IFrame API (로드된 스크립트용) */
declare global {
  namespace YT {
    interface PlayerOptions {
      videoId?: string
      width?: number
      height?: number
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: (event: { target: YT.Player }) => void
        onStateChange?: (event: { target: YT.Player }) => void
      }
    }

    interface Player {
      playVideo(): void
      pauseVideo(): void
      stopVideo(): void
      mute(): void
      unMute(): void
      isMuted(): boolean
      setVolume(volume: number): void
      getVolume(): number
    }

    interface PlayerConstructor {
      new (elementId: string, options: YT.PlayerOptions): YT.Player
    }

    const Player: PlayerConstructor
  }

  interface Window {
    YT?: { Player: YT.PlayerConstructor; loading: number }
    onYouTubeIframeAPIReady?: () => void
  }
}

export {}
