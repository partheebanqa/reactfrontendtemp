interface Folder {
  id: string;
  name?: string;
  Name?: string;
  folders?: Folder[];
}

interface Collection {
  id: string;
  name: string;
  folders?: Folder[];
}

interface Request {
  id?: string;
  name: string;
  folderId?: string;
  collectionId?: string;
}

function findFolderById(
  folders: Folder[] = [],
  folderId: string,
  path: string[] = []
): string[] | null {
  for (const folder of folders) {
    const folderName = folder.name || folder.Name || 'Folder';
    const currentPath = [...path, folderName];

    if (folder.id === folderId) {
      return currentPath;
    }

    if (folder.folders && folder.folders.length > 0) {
      const result = findFolderById(folder.folders, folderId, currentPath);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

export function generateRequestBreadcrumb(
  request: Request,
  collection: Collection | null
): string {
  if (!collection) return request.name || 'Untitled Request';
  return `${collection.name} / ${request.name || 'Untitled Request'}`;
}

export function generateRequestBreadcrumbWithSeparator(
  request: Request,
  collection: Collection | null,
  separator: string = ' / '
): string {
  if (!collection) {
    return request.name || 'Untitled Request';
  }

  const parts: string[] = [collection.name];

  if (request.folderId && collection.folders) {
    const folderPath = findFolderById(collection.folders, request.folderId);
    if (folderPath) {
      parts.push(...folderPath);
    }
  }

  parts.push(request.name || 'Untitled Request');

  return parts.join(separator);
}

export function getCollectionName(collection: Collection | null): string {
  return collection?.name || 'Unknown Collection';
}

export function getFolderPathArray(
  folderId: string | undefined,
  collection: Collection | null
): string[] {
  if (!folderId || !collection?.folders) {
    return [];
  }

  return findFolderById(collection.folders, folderId) || [];
}
