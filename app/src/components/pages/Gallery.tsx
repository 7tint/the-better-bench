import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import { isOnline, getOfflineEntries } from "../../services/offlineStorage";
import BenchCard from "../common/BenchCard";
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

const Gallery: React.FC = () => {
  const [benches, setBenches] = useState<BenchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");

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
      typeof (newData.createdAt as { toDate?: () => Date }).toDate ===
        "function"
    ) {
      newData.createdAt = (
        newData.createdAt as { toDate: () => Date }
      ).toDate();
    } else if (newData.createdAt) {
      newData.createdAt = ensureDate(newData.createdAt as Date | string);
    }

    if (
      newData.updatedAt &&
      typeof (newData.updatedAt as { toDate?: () => Date }).toDate ===
        "function"
    ) {
      newData.updatedAt = (
        newData.updatedAt as { toDate: () => Date }
      ).toDate();
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

  useEffect(() => {
    const fetchBenches = async () => {
      setLoading(true);
      try {
        let benchesData: BenchEntry[] = [];

        if (isOnline()) {
          const benchesQuery = query(
            collection(db, "benches"),
            orderBy(
              sortBy === "date" ? "dateVisited" : "ratings.overall",
              "desc"
            )
          );

          const snapshot = await getDocs(benchesQuery);

          benchesData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...convertTimestampsToDates(data),
            };
          }) as BenchEntry[];
        } else {
          const offlineEntries = getOfflineEntries();

          benchesData = offlineEntries.map((entry) => {
            const processedEntry = {
              ...entry,
              id: entry.id || entry.tempId || "",
              dateVisited: ensureDate(entry.dateVisited),
              createdAt: ensureDate(entry.createdAt),
              updatedAt: ensureDate(entry.updatedAt),
            };

            // Ensure location coordinates are numbers
            if (processedEntry.location) {
              processedEntry.location = {
                ...processedEntry.location,
                latitude: ensureNumber(processedEntry.location.latitude),
                longitude: ensureNumber(processedEntry.location.longitude),
              };
            }

            return processedEntry;
          }) as BenchEntry[];

          if (sortBy === "date") {
            benchesData.sort(
              (a, b) => b.dateVisited.getTime() - a.dateVisited.getTime()
            );
          } else {
            benchesData.sort((a, b) => {
              const ratingA =
                typeof a.ratings.overall === "number"
                  ? a.ratings.overall
                  : parseFloat(a.ratings.overall || "0");
              const ratingB =
                typeof b.ratings.overall === "number"
                  ? b.ratings.overall
                  : parseFloat(b.ratings.overall || "0");
              return ratingB - ratingA;
            });
          }
        }

        setBenches(benchesData);
      } catch (error) {
        console.error("Error fetching benches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBenches();
  }, [sortBy]);

  const handleSortChange = (newSortBy: "date" | "rating") => {
    setSortBy(newSortBy);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-pulse">
          <p className="font-serif text-old-ink">Developing the gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="my-8">
        <h2 className="newspaper-headline text-3xl text-old-ink mb-4">
          Bench Gallery
        </h2>
        <p className="font-serif text-old-ink mb-6">
          Browse our complete collection of remarkable benches from around the
          world.
        </p>

        <div className="flex justify-end mb-4">
          <div className="inline-flex border border-old-ink">
            <button
              className={`px-4 py-2 font-mono text-sm ${
                sortBy === "date"
                  ? "bg-old-ink text-cream"
                  : "bg-newsprint text-old-ink"
              }`}
              onClick={() => handleSortChange("date")}
            >
              By Date
            </button>
            <button
              className={`px-4 py-2 font-mono text-sm ${
                sortBy === "rating"
                  ? "bg-old-ink text-cream"
                  : "bg-newsprint text-old-ink"
              }`}
              onClick={() => handleSortChange("rating")}
            >
              By Rating
            </button>
          </div>
        </div>
      </div>

      {benches.length === 0 ? (
        <div className="text-center py-8 bg-newsprint border border-old-ink">
          <p className="font-serif text-old-ink">
            No benches have been documented yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {benches.map((bench) => (
            <BenchCard key={bench.id} bench={bench} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;
