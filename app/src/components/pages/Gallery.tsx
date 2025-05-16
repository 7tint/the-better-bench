import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import BenchCard from "../common/BenchCard";
import type { BenchEntry } from "../../types";

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
    }
    if (
      newData.createdAt &&
      typeof (newData.createdAt as { toDate?: () => Date }).toDate ===
        "function"
    ) {
      newData.createdAt = (
        newData.createdAt as { toDate: () => Date }
      ).toDate();
    }
    if (
      newData.updatedAt &&
      typeof (newData.updatedAt as { toDate?: () => Date }).toDate ===
        "function"
    ) {
      newData.updatedAt = (
        newData.updatedAt as { toDate: () => Date }
      ).toDate();
    }

    return newData;
  };

  useEffect(() => {
    const fetchBenches = async () => {
      setLoading(true);
      try {
        const benchesQuery = query(
          collection(db, "benches"),
          orderBy(sortBy === "date" ? "dateVisited" : "ratings.overall", "desc")
        );

        const snapshot = await getDocs(benchesQuery);

        const benchesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertTimestampsToDates(data),
          };
        }) as BenchEntry[];

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
