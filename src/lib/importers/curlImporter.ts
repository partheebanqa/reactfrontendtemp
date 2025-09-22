import { v4 as uuidv4 } from 'uuid';
import { Collection, CollectionRequest, ImportResult } from '../../types';
// import { toPostmanCollection } from 'curlconverter';


export function importCurlCommand(curl: string): ImportResult {
  try {

    const parts = curl.split(' ');
    let method = 'GET';
    let url = '';
    const headers: Record<string, string> = {};
    let body = '';

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      
      if (part === '-X' || part === '--request') {
        method = parts[++i];
        continue;
      }

      if (part === '-H' || part === '--header') {
        const header = parts[++i].split(':').map(s => s.trim());
        headers[header[0]] = header[1];
        continue;
      }

      if (part === '-d' || part === '--data') {
        body = parts[++i];
        continue;
      }

      if (!part.startsWith('-')) {
        url = part.replace(/['"]/g, '');
      }
    }

    const request: CollectionRequest = {
      id: uuidv4(),
      name: `Imported cURL Request`,
      request: {
        method,
        url,
        headers,
        params: {},
        body
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const collection: Collection = {
      id: uuidv4(),
      name: 'Imported cURL Collection',
      folders: [],
      requests: [request],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      changelog: [{
        id: uuidv4(),
        action: 'create',
        itemType: 'collection',
        itemId: uuidv4(),
        itemName: 'Imported cURL Collection',
        timestamp: new Date().toISOString(),
        details: 'Imported from cURL command'
      }]
    };

    return { collections: [collection] };
  } catch (error) {
    throw new Error(`Failed to import cURL command: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}






// export const importCurlCommandNew = (curl: string) => {
//   const postmanJson = toPostmanCollection(curl);

//   return {
//     collectionName: postmanJson.info?.name || 'Imported cURL Collection',
//     specificationType: 'postman',
//     ...postmanJson
//   };
// };
