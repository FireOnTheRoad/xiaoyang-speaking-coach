const DB_NAME = 'sayfield-recordings'
const STORE_NAME = 'recordings'
const DB_VERSION = 1

const openDatabase = (): Promise<IDBDatabase | null> => new Promise((resolve) => {
  if (!('indexedDB' in window)) {
    resolve(null)
    return
  }
  const request = indexedDB.open(DB_NAME, DB_VERSION)
  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME)
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => resolve(null)
})

export const saveRecording = async (id: string, blob: Blob) => {
  const db = await openDatabase()
  if (!db) return false
  return new Promise<boolean>((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(blob, id)
    transaction.oncomplete = () => resolve(true)
    transaction.onerror = () => resolve(false)
  })
}

export const loadRecording = async (id: string): Promise<Blob | null> => {
  const db = await openDatabase()
  if (!db) return null
  return new Promise<Blob | null>((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null)
    request.onerror = () => resolve(null)
  })
}

export const deleteRecording = async (id: string) => {
  const db = await openDatabase()
  if (!db) return
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => resolve()
  })
}

export const clearRecordings = async () => {
  const db = await openDatabase()
  if (!db) return
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => resolve()
  })
}
