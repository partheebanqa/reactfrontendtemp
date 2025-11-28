const WORKSPACE_STORAGE_KEY = 'app:activeWorkspace';

export const saveActiveWorkspace = (workspaceId: string): void => {
  try {
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ id: workspaceId })
    );
  } catch (error) {
    console.warn('Failed to save active workspace to localStorage:', error);
  }
};

export const getSavedWorkspaceId = (): string | null => {
  try {
    const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.id || null;
    }
  } catch (error) {
    console.warn('Failed to read active workspace from localStorage:', error);
  }
  return null;
};

export const clearSavedWorkspace = (): void => {
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear saved workspace from localStorage:', error);
  }
};

export const clearWorkspaceStorage = (): void => {
  clearSavedWorkspace();
};
