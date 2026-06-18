import type { EditorState } from '@floorplanner/store/index'

export function hasPendingEditorChanges(state: Pick<
  EditorState,
  | 'saveStatus'
  | 'saveError'
  | 'activeDocumentSource'
  | 'currentDocumentHash'
  | 'lastCloudSyncHash'
  | 'lastFileSyncHash'
>): boolean {
  if (state.saveStatus === 'saving' || state.saveStatus === 'error' || state.saveError !== null) {
    return true
  }

  if (state.activeDocumentSource === 'cloud') {
    return state.currentDocumentHash !== state.lastCloudSyncHash
  }

  if (state.activeDocumentSource === 'file') {
    return state.currentDocumentHash !== state.lastFileSyncHash
  }

  return false
}

export function getPendingChangesMessage(action: string): string {
  return `You have changes that are not fully saved to the current source. ${action} anyway?`
}
