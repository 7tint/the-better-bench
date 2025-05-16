import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { isOnline, getOfflineEntries } from "../../services/offlineStorage";
import BenchForm from "../admin/BenchForm";
import type { BenchEntry } from "../../types";

const ensureDate = (date: Date | string | number | null | undefined): Date => {
  if (date instanceof Date) {
    return date;
  } else if (typeof date === "string") {
    return new Date(date);
  } else if (typeof date === "number") {
    return new Date(date);
  }
  return new Date();
};

const ensureNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    return parseFloat(value) || 0;
  }
  return 0;
};

const convertTimestampsToDates = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const newData = { ...data };

  if (
    newData.dateVisited &&
    typeof (newData.dateVisited as { toDate?: () => Date }).toDate ===
      "function"
  ) {
    newData.dateVisited = (
      newData.dateVisited as { toDate: () => Date }
    ).toDate();
  } else if (newData.dateVisited) {
    newData.dateVisited = ensureDate(newData.dateVisited as Date | string);
  }

  if (
    newData.createdAt &&
    typeof (newData.createdAt as { toDate?: () => Date }).toDate === "function"
  ) {
    newData.createdAt = (newData.createdAt as { toDate: () => Date }).toDate();
  } else if (newData.createdAt) {
    newData.createdAt = ensureDate(newData.createdAt as Date | string);
  }

  if (
    newData.updatedAt &&
    typeof (newData.updatedAt as { toDate?: () => Date }).toDate === "function"
  ) {
    newData.updatedAt = (newData.updatedAt as { toDate: () => Date }).toDate();
  } else if (newData.updatedAt) {
    newData.updatedAt = ensureDate(newData.updatedAt as Date | string);
  }

  if (newData.location && typeof newData.location === "object") {
    const location = newData.location as Record<string, unknown>;
    if ("latitude" in location) {
      location.latitude = ensureNumber(location.latitude);
    }
    if ("longitude" in location) {
      location.longitude = ensureNumber(location.longitude);
    }
  }

  return newData;
};

const AdminDashboard: React.FC = () => {
  const [benches, setBenches] = useState<BenchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentBench, setCurrentBench] = useState<
    Partial<BenchEntry> | undefined
  >(undefined);

  useEffect(() => {
    fetchBenches();
  }, []);

  const fetchBenches = async () => {
    setLoading(true);
    try {
      let benchesData: BenchEntry[] = [];

      if (isOnline()) {
        const benchesRef = collection(db, "benches");
        const snapshot = await getDocs(benchesRef);
        benchesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertTimestampsToDates(data),
          } as BenchEntry;
        });
      }

      const offlineEntries = getOfflineEntries();

      const offlineBenches = offlineEntries.map((entry) => ({
        ...entry,
        id: entry.id || entry.tempId || "",
        _offline: true,
        dateVisited: ensureDate(entry.dateVisited),
        createdAt: ensureDate(entry.createdAt),
        updatedAt: ensureDate(entry.updatedAt),
      })) as BenchEntry[];

      // Combine online and offline benches, preferring online versions
      // if the same bench exists in both places
      const combinedBenches = [...benchesData];

      offlineBenches.forEach((offlineBench) => {
        if (!combinedBenches.some((b) => b.id === offlineBench.id)) {
          combinedBenches.push(offlineBench);
        }
      });

      setBenches(combinedBenches);
    } catch (error) {
      console.error("Error fetching benches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (bench?: BenchEntry) => {
    setCurrentBench(bench);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentBench(undefined);
  };

  const handleSubmit = async (benchData: Partial<BenchEntry>) => {
    try {
      const now = new Date();

      if (isOnline()) {
        if (benchData.id && !benchData.id.startsWith("temp-")) {
          const benchRef = doc(db, "benches", benchData.id);
          await updateDoc(benchRef, {
            ...benchData,
            updatedAt: now,
          });
        } else {
          await addDoc(collection(db, "benches"), {
            ...benchData,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      fetchBenches();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving bench:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this bench?")) {
      try {
        if (id.startsWith("temp-") || !isOnline()) {
          const entries = getOfflineEntries();
          const updatedEntries = entries.filter(
            (entry) => entry.id !== id && entry.tempId !== id
          );

          localStorage.setItem(
            "offline-bench-entries",
            JSON.stringify(updatedEntries)
          );
        } else if (isOnline()) {
          await deleteDoc(doc(db, "benches", id));
        }

        // Refresh the list
        fetchBenches();
      } catch (error) {
        console.error("Error deleting bench:", error);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminAuthenticated");
    window.location.href = "/admin/login";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="newspaper-headline text-2xl">Editor's Desk</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-newsprint text-old-ink font-mono text-sm border border-old-ink"
        >
          Sign Out
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={() => handleOpenForm()}
          className="px-6 py-3 bg-old-ink text-cream font-serif uppercase tracking-wider text-sm shadow-newspaper"
        >
          Add New Bench
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="font-serif text-old-ink">Loading benches...</p>
        </div>
      ) : (
        <div className="bg-cream border border-old-ink">
          <table className="w-full">
            <thead>
              <tr className="border-b border-old-ink">
                <th className="p-3 text-left font-serif">Name</th>
                <th className="p-3 text-left font-serif">Date Visited</th>
                <th className="p-3 text-left font-serif">Rating</th>
                <th className="p-3 text-left font-serif">Status</th>
                <th className="p-3 text-left font-serif">Actions</th>
              </tr>
            </thead>
            <tbody>
              {benches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center font-mono text-sm">
                    No benches found. Add your first bench!
                  </td>
                </tr>
              ) : (
                benches.map((bench) => (
                  <tr key={bench.id} className="border-b border-old-ink">
                    <td className="p-3 font-mono text-sm">{bench.name}</td>
                    <td className="p-3 font-mono text-sm">
                      {bench.dateVisited.toLocaleDateString()}
                    </td>
                    <td className="p-3 font-mono text-sm">
                      {bench.ratings.overall}/10
                    </td>
                    <td className="p-3 font-mono text-sm">
                      {bench._offline ? (
                        <span className="text-film-red">Pending sync</span>
                      ) : (
                        <span className="text-green-600">Synced</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-sm">
                      <button
                        onClick={() => handleOpenForm(bench)}
                        className="mr-2 underline text-accent1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bench.id)}
                        className="underline text-film-red"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <BenchForm
        bench={currentBench}
        onSubmit={handleSubmit}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />
    </div>
  );
};

export default AdminDashboard;
