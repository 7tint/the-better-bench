import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { BenchEntry } from "../../types";
import BenchCard from "../common/BenchCard";

// Helper function to convert Firestore timestamps to JavaScript Dates
const convertTimestampsToDates = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const newData = { ...data };

  // Convert both dateVisited, createdAt, and updatedAt if they exist and are Firestore timestamps
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
    typeof (newData.createdAt as { toDate?: () => Date }).toDate === "function"
  ) {
    newData.createdAt = (newData.createdAt as { toDate: () => Date }).toDate();
  }
  if (
    newData.updatedAt &&
    typeof (newData.updatedAt as { toDate?: () => Date }).toDate === "function"
  ) {
    newData.updatedAt = (newData.updatedAt as { toDate: () => Date }).toDate();
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
        // Get featured benches (highest rated)
        const featuredQuery = query(
          collection(db, "benches"),
          orderBy("ratings.overall", "desc"),
          limit(1)
        );

        // Get recent benches
        const recentQuery = query(
          collection(db, "benches"),
          orderBy("dateVisited", "desc"),
          limit(3)
        );

        const [featuredSnapshot, recentSnapshot] = await Promise.all([
          getDocs(featuredQuery),
          getDocs(recentQuery),
        ]);

        const featuredData = featuredSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertTimestampsToDates(data),
          };
        }) as BenchEntry[];

        const recentData = recentSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...convertTimestampsToDates(data),
          };
        }) as BenchEntry[];

        setFeaturedBenches(featuredData);
        setRecentBenches(recentData);
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

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-serif italic text-lg text-old-ink">
          "Documenting the world's finest resting places, one bench at a time"
        </h2>
      </div>

      {featuredBenches.length > 0 && (
        <div className="mb-12">
          <h2 className="newspaper-headline text-2xl mb-4">Today's Feature</h2>

          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <div className="bg-cream p-4 shadow-polaroid border border-faded-black relative max-w-[550px]">
              <div className="relative">
                <img
                  src={featuredBenches[0].images[0]}
                  alt={featuredBenches[0].name}
                  className="w-full object-cover max-w-[500px] max-h-[400px] mx-auto"
                  style={{
                    aspectRatio: "4/3",
                    filter: "saturate(1.1) contrast(1.05)",
                  }}
                />
                <div className="date-stamp-red">
                  {featuredBenches[0].dateVisited
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
                  {featuredBenches[0].name}
                </h3>
                <p className="font-mono text-sm text-old-ink">
                  Overall Rating: {featuredBenches[0].ratings.overall}/10
                </p>
              </div>
            </div>

            <div className="md:w-1/3 bg-cream p-6 border border-old-ink">
              <h3 className="font-serif font-bold text-xl text-old-ink mb-3">
                Bench of the Day
              </h3>

              <div className="magazine-column">
                <p className="font-serif text-sm text-old-ink mb-3">
                  Our editors have selected this exceptional bench for today's
                  feature. Located at coordinates{" "}
                  {featuredBenches[0].location.latitude.toFixed(4)},{"\u00A0"}
                  {featuredBenches[0].location.longitude.toFixed(4)}, this bench
                  offers an experience that stands out from the ordinary.
                </p>

                <p className="font-serif text-sm text-old-ink">
                  {featuredBenches[0].notes ||
                    "The bench beckons visitors with its unique charm and character, promising a moment of respite in a busy world. Its design speaks to both form and function, creating a perfect harmony between aesthetics and comfort."}
                </p>
              </div>

              <Link
                to={`/bench/${featuredBenches[0].id}`}
                className="block mt-4 text-center font-mono text-sm text-accent1 underline"
              >
                Continue Reading →
              </Link>
            </div>
          </div>
        </div>
      )}

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
