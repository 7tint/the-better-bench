import type { BenchEntry } from "../types";
import { db, storage } from "./firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const OFFLINE_STORAGE_KEY = "offline-bench-entries";
const NETWORK_STATUS_KEY = "is-online";

export const isOnline = (): boolean => {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

export const setNetworkStatus = (online: boolean): void => {
  localStorage.setItem(NETWORK_STATUS_KEY, JSON.stringify(online));
};

export const getOfflineEntries = (): Partial<BenchEntry>[] => {
  const entries = localStorage.getItem(OFFLINE_STORAGE_KEY);
  return entries ? JSON.parse(entries) : [];
};

export const saveOfflineEntry = async (
  benchData: Partial<BenchEntry>
): Promise<string> => {
  const entries = getOfflineEntries();

  const tempId = `temp-${uuidv4()}`;
  const now = new Date();

  const newEntry = {
    ...benchData,
    tempId,
    createdAt: now,
    updatedAt: now,
    _status: "pending" as const, // Fix type to match the union type in BenchEntry
  };

  entries.push(newEntry);
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(entries));

  return tempId;
};

const processBenchEntry = async (
  benchData: Partial<BenchEntry>
): Promise<void> => {
  const now = new Date();

  const imageUrls = await Promise.all(
    (benchData.images || []).map(async (imageData) => {
      if (!imageData.startsWith("data:")) {
        return imageData;
      }

      const imageId = uuidv4();
      const imageExtension = imageData.split(";")[0].split("/")[1] || "jpeg";
      const filename = `bench-images/${
        benchData.id || "new"
      }-${imageId}.${imageExtension}`;
      const storageRef = ref(storage, filename);

      const snapshot = await uploadString(storageRef, imageData, "data_url");
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return downloadUrl;
    })
  );

  const entryToSave = {
    ...benchData,
    images: imageUrls,
    updatedAt: now,
  };

  if (benchData.id && !benchData.id.startsWith("temp-")) {
    const benchRef = doc(db, "benches", benchData.id);
    await updateDoc(benchRef, entryToSave);
  } else {
    await addDoc(collection(db, "benches"), {
      ...entryToSave,
      createdAt: now,
    });
  }
};

export const syncOfflineEntries = async (): Promise<void> => {
  if (!isOnline()) {
  }

  const entries = getOfflineEntries();
  if (entries.length === 0) {
    return; // No entries to sync
  }

  const syncPromises = entries.map(processBenchEntry);

  try {
    await Promise.all(syncPromises);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify([]));
    console.log(`Synced ${entries.length} offline entries successfully`);
  } catch (error) {
    console.error("Error syncing offline entries:", error);
    throw error;
  }
};

export const initializeOfflineSupport = (): void => {
  setNetworkStatus(isOnline());

  window.addEventListener("online", () => {
    setNetworkStatus(true);
    syncOfflineEntries().catch(console.error);
  });

  window.addEventListener("offline", () => {
    setNetworkStatus(false);
  });

  if (isOnline()) {
    syncOfflineEntries().catch(console.error);
  }
};

export const getPendingEntryCount = (): number => {
  return getOfflineEntries().length;
};
