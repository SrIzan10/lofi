import type { Song, Atmosphere, Preset, Station, Background } from './types'; // Added Preset, Station, Background

export const state = $state({
  hasInteracted: false,
  currentStation: null as number | null,
  currentSong: null as Song | null,
  songQueue: [] as Song[],
  isPlaying: true,
  volume: 0.5,
  isMuted: false,
  currentBackgroundId: null as string | null,
  backgroundElement: null as HTMLVideoElement | null,
  activeAtmospheres: {} as Record<string, number>, // { atmosphereId: volume (0-100) }
  isLoading: true,
  error: null as string | null,
  currentTime: 0,
  duration: 0,

  presets: [] as Preset[],
  stations: [] as Station[],
  backgrounds: [] as Background[],
  atmospheres: [] as Atmosphere[],
  
  windowZIndexCounter: 50,

  todoList: [] as string[],
  showTodoList: false,

  show202020: false,
  is202020Active: false,
  workRuleTimer: 20 * 60,
  restRuleTimer: 20,

  showPomodoro: false,
  pomodoroTimer: 20 * 60,
  pomodoroBreakTimer: 5 * 60,
  isPomodoroActive: false,
  pomodoroWorkPhase: true,

  showStats: false,

  // in daemon.svelte
  togglePlay: (() => {}) as () => void,
});
