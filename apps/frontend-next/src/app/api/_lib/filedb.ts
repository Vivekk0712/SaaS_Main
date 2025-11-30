import fs from 'fs';
import path from 'path';

// The project root is 6 levels up from this file's directory.
const dbPath = path.resolve(__dirname, '../../../../../../data/local-db.json');

export function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, it's an error condition we should probably handle.
    // For now, returning null as the calling code seems to handle it.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export function writeDB(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}
