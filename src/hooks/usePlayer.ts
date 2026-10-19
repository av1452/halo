import { useSyncExternalStore } from 'react'
import { player } from '../services/player'

export function usePlayer() {
  return useSyncExternalStore(player.subscribe, player.getState, player.getState)
}
