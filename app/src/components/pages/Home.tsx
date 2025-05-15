import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { BenchEntry } from "../../types";
import BenchCard from "../common/BenchCard";

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

        const featuredData = featuredSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BenchEntry[];

        const recentData = recentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BenchEntry[];

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
          <p className="font-serif text-oldInk">Developing...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-serif italic text-lg text-oldInk">
          "Documenting the world's finest resting places, one bench at a time"
        </h2>
      </div>

      {featuredBenches.length > 0 && (
        <div className="mb-12">
          <h2 className="newspaper-headline text-2xl mb-4">Today's Feature</h2>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <div className="bg-white p-4 pb-20 shadow-polaroid">
                <div className="relative">
                  <img
                    src={featuredBenches[0].images[0]}
                    alt={featuredBenches[0].name}
                    className="w-full object-cover"
                    style={{
                      aspectRatio: "4/3",
                      filter: "saturate(1.2) contrast(1.1)",
                    }}
                  />

                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-flash to-transparent opacity-60"></div>
                  <div className="date-stamp">
                    {featuredBenches[0].dateVisited
                      .toLocaleDateString("en-US", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                      })
                      .replace(/\//g, "-")}
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 text-center">
                  <h3 className="font-serif text-lg text-oldInk mb-1">
                    {featuredBenches[0].name}
                  </h3>
                  <p className="font-mono text-sm text-oldInk">
                    Overall Rating: {featuredBenches[0].ratings.overall}/10
                  </p>
                </div>
              </div>
            </div>

            <div className="md:w-1/3 bg-cream p-6 border border-oldInk">
              <h3 className="font-serif font-bold text-xl text-oldInk mb-3">
                Bench of the Day
              </h3>

              <div className="magazine-column">
                <p className="font-serif text-sm text-oldInk mb-3">
                  Our editors have selected this exceptional bench for today's
                  feature. Located at coordinates{" "}
                  {featuredBenches[0].location.latitude.toFixed(4)},
                  {featuredBenches[0].location.longitude.toFixed(4)}, this bench
                  offers an experience that stands out from the ordinary.
                </p>

                <p className="font-serif text-sm text-oldInk">
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
            className="inline-block px-6 py-2 bg-oldInk text-cream font-serif uppercase tracking-wider text-sm shadow-newspaper transform transition hover:translate-x-px hover:translate-y-px"
          >
            View All Benches
          </Link>
        </div>
      </div>

      <div className="mt-12 p-6 border-2 border-dashed border-oldInk bg-yellowedPaper">
        <p className="font-mono text-xs text-center text-oldInk uppercase tracking-widest mb-2">
          Advertisement
        </p>
        <div className="text-center">
          <h3 className="font-serif font-bold text-2xl text-accent1 mb-2">
            Got a Bench to Share?
          </h3>
          <p className="font-serif text-oldInk mb-4">
            Contribute to our growing collection of remarkable benches!
          </p>
          <Link
            to="/admin"
            className="inline-block px-4 py-2 bg-accent1 text-white font-serif uppercase tracking-wider text-sm"
          >
            Submit Your Bench
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
