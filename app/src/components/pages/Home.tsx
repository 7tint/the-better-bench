import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../services/firebase";
import { isOnline, getOfflineEntries } from "../../services/offlineStorage";
import type { BenchEntry } from "../../types";
import BenchCard from "../common/BenchCard";

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

const Home: React.FC = () => {
  const [featuredBenches, setFeaturedBenches] = useState<BenchEntry[]>([]);
  const [recentBenches, setRecentBenches] = useState<BenchEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenches = async () => {
      try {
        let allBenches: BenchEntry[] = [];

        if (isOnline()) {
          const allBenchesQuery = query(collection(db, "benches"));
          const recentQuery = query(
            collection(db, "benches"),
            orderBy("dateVisited", "desc"),
            limit(3)
          );

          const [allBenchesSnapshot, recentSnapshot] = await Promise.all([
            getDocs(allBenchesQuery),
            getDocs(recentQuery),
          ]);

          allBenches = allBenchesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...convertTimestampsToDates(data),
            } as BenchEntry;
          });

          const recentData = recentSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...convertTimestampsToDates(data),
            } as BenchEntry;
          });

          setRecentBenches(recentData);
        } else {
          const offlineEntries = getOfflineEntries();

          allBenches = offlineEntries.map((entry) => {
            const processedEntry = {
              ...entry,
              id: entry.id || entry.tempId || "",
              dateVisited: ensureDate(entry.dateVisited),
              createdAt: ensureDate(entry.createdAt),
              updatedAt: ensureDate(entry.updatedAt),
            };

            if (processedEntry.location) {
              processedEntry.location = {
                ...processedEntry.location,
                latitude: ensureNumber(processedEntry.location.latitude),
                longitude: ensureNumber(processedEntry.location.longitude),
              };
            }

            return processedEntry;
          }) as BenchEntry[];

          const sortedEntries = [...allBenches].sort(
            (a, b) => b.dateVisited.getTime() - a.dateVisited.getTime()
          );

          setRecentBenches(sortedEntries.slice(0, 3));
        }

        if (allBenches.length > 0) {
          const today = new Date();
          const dateSeed =
            today.getFullYear() * 10000 +
            (today.getMonth() + 1) * 100 +
            today.getDate();
          const randomIndex = dateSeed % (allBenches.length || 1);
          const featuredData = [allBenches[randomIndex]];

          featuredData[0].dateVisited = ensureDate(featuredData[0].dateVisited);

          if (featuredData[0].location) {
            featuredData[0].location.latitude = ensureNumber(
              featuredData[0].location.latitude
            );
            featuredData[0].location.longitude = ensureNumber(
              featuredData[0].location.longitude
            );
          }

          setFeaturedBenches(featuredData);
        } else {
          setFeaturedBenches([]);
        }
      } catch (error) {
        console.error("Error fetching benches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBenches();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-pulse">
          <p className="font-serif text-old-ink">Developing...</p>
        </div>
      </div>
    );
  }

  const renderFeaturedBench = () => {
    if (!featuredBenches.length || !featuredBenches[0]) {
      return null;
    }

    const featured = featuredBenches[0];
    const latitude = ensureNumber(featured.location?.latitude).toFixed(4);
    const longitude = ensureNumber(featured.location?.longitude).toFixed(4);

    return (
      <div className="mb-12">
        <h2 className="newspaper-headline text-2xl mb-4">Today's Feature</h2>

        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <div className="bg-cream p-4 shadow-polaroid border border-faded-black relative max-w-[550px]">
            <div className="relative">
              {featured.images && featured.images.length > 0 ? (
                <img
                  src={featured.images[0]}
                  alt={featured.name}
                  className="w-full object-cover max-w-[500px] max-h-[400px] mx-auto"
                  style={{
                    aspectRatio: "4/3",
                    filter: "saturate(1.1) contrast(1.05)",
                  }}
                />
              ) : (
                <div className="w-full h-full bg-newsprint flex items-center justify-center aspect-[4/3]">
                  <span className="font-mono text-white">No Image</span>
                </div>
              )}
              <div className="date-stamp-red">
                {ensureDate(featured.dateVisited)
                  .toLocaleDateString("en-US", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  })
                  .replace(/\//g, "-")}
              </div>
            </div>

            <div className="mt-4 mb-2 text-center">
              <h3 className="font-serif text-lg text-old-ink mb-1">
                {featured.name}
              </h3>
              <p className="font-mono text-sm text-old-ink">
                Overall Rating: {featured.ratings.overall}/10
              </p>
            </div>
          </div>

          <div className="md:w-1/3 bg-cream p-6 border border-old-ink">
            <h3 className="font-serif font-bold text-xl text-old-ink mb-3">
              Today's Random Feature
            </h3>

            <div className="magazine-column">
              <p className="font-serif text-sm text-old-ink mb-3 italic">
                Our editors have randomly selected this bench for today's
                feature. Located at coordinates {latitude},{"\u00A0"}
                {longitude}, this bench offers a unique experience worth
                exploring.
              </p>

              <p className="font-serif text-sm text-old-ink font-bold">
                {featured.notes}
              </p>
            </div>

            <Link
              to={`/bench/${featured.id}`}
              className="block mt-4 text-center font-mono text-sm text-accent1 underline"
            >
              Continue Reading →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-serif italic text-lg text-old-ink">
          "Documenting the world's finest resting places, one bench at a time"
        </h2>
      </div>

      {featuredBenches.length > 0 && renderFeaturedBench()}

      <div>
        <h2 className="newspaper-headline text-xl mb-6">Latest Discoveries</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recentBenches.map((bench) => (
            <BenchCard key={bench.id} bench={bench} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/gallery"
            className="inline-block px-6 py-2 bg-accent3 font-serif uppercase tracking-wider text-sm shadow-newspaper transform transition hover:translate-x-px hover:translate-y-px"
          >
            <div className="text-cream">View All Benches</div>
          </Link>
        </div>
      </div>

      <div className="mt-12 p-6 border-2 border-dashed border-old-ink bg-yellowed-paper">
        <p className="font-mono text-xs text-center text-old-ink uppercase tracking-widest mb-2">
          Editor's Note
        </p>
        <div className="text-center">
          <h3 className="font-serif font-bold text-2xl text-accent1 mb-2">
            Why Benches?
          </h3>
          <p className="font-serif text-old-ink mb-4 whitespace-pre-wrap">
            Have you ever wondered why benches are so important? {"\n"}
            They are not just spots to rest at; {"\n"} they are a place for
            introspection, a nudge to breathe the air, and a reminder to
            appreciate the world around us. {"\n"}
          </p>
          <Link
            target="_blank"
            to="https://www.youtube.com/watch?v=cRSbCLU7HuU"
            className="inline-block px-4 py-2 bg-accent1 text-overexposed font-serif uppercase tracking-wider text-sm hover:translate-x-px hover:translate-y-px"
          >
            <div className="text-cream">Pedro's Bench</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
