import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { isOnline, getOfflineEntries } from "../../services/offlineStorage";
import RatingDisplay from "../common/RatingDisplay";
import type { BenchEntry } from "../../types";

const ensureNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    return parseFloat(value) || 0;
  }
  return 0;
};

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

const BenchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [bench, setBench] = useState<BenchEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchBench = async () => {
      if (!id) return;

      try {
        setLoading(true);

        if (!isOnline()) {
          const offlineEntries = getOfflineEntries();
          const offlineBench = offlineEntries.find(
            (entry) => entry.id === id || entry.tempId === id
          );

          if (offlineBench) {
            const benchData = {
              ...offlineBench,
              id: offlineBench.id || offlineBench.tempId || id,
              dateVisited: ensureDate(offlineBench.dateVisited),
              createdAt: ensureDate(offlineBench.createdAt),
              updatedAt: ensureDate(offlineBench.updatedAt),
            } as BenchEntry;

            if (benchData.location) {
              benchData.location.latitude = ensureNumber(
                benchData.location.latitude
              );
              benchData.location.longitude = ensureNumber(
                benchData.location.longitude
              );
            }

            setBench(benchData);
            setLoading(false);
            return;
          }
        }

        const benchDoc = await getDoc(doc(db, "benches", id));

        if (benchDoc.exists()) {
          const data = benchDoc.data();
          const benchData = {
            id: benchDoc.id,
            ...data,
            dateVisited: data.dateVisited?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as BenchEntry;

          if (benchData.location) {
            benchData.location.latitude = ensureNumber(
              benchData.location.latitude
            );
            benchData.location.longitude = ensureNumber(
              benchData.location.longitude
            );
          }

          setBench(benchData);
        } else {
          console.error("Bench not found");
        }
      } catch (error) {
        console.error("Error fetching bench:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBench();
  }, [id]);

  const handlePrevImage = () => {
    if (!bench?.images || bench.images.length === 0) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? bench.images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    if (!bench?.images || bench.images.length === 0) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === bench.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-pulse">
          <p className="font-serif text-old-ink">Developing...</p>
        </div>
      </div>
    );
  }

  if (!bench) {
    return (
      <div className="text-center py-10">
        <h2 className="newspaper-headline text-old-ink text-2xl">
          Bench Not Found
        </h2>
        <p className="font-serif mt-4 text-old-ink">
          This bench seems to have vanished.
        </p>
        <Link
          to="/gallery"
          className="inline-block mt-4 px-4 py-2 font-mono text-accent1 underline"
        >
          Return to Gallery
        </Link>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const latitude = ensureNumber(bench.location?.latitude);
  const longitude = ensureNumber(bench.location?.longitude);

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/gallery"
          className="font-mono text-sm text-accent1 hover:underline"
        >
          &larr; Back to Gallery
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="newspaper-headline text-3xl text-old-ink mb-2">
          {bench.name}
        </h1>
        <p className="font-mono text-sm text-old-ink">
          Documented on {formatDate(bench.dateVisited)}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        <div className="lg:w-3/5">
          <div className="bg-cream p-4 border-2 border-old-ink shadow-polaroid mb-4">
            <div className="relative aspect-[4/3] bg-faded-black overflow-hidden">
              {bench.images && bench.images.length > 0 ? (
                <img
                  src={bench.images[currentImageIndex]}
                  alt={`${bench.name} - view ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  style={{ filter: "saturate(1.2) contrast(1.05)" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-newsprint">
                  <span className="font-mono text-old-ink">
                    No Images Available
                  </span>
                </div>
              )}

              {bench.images && bench.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-old-ink bg-opacity-50 text-cream hover:bg-opacity-70"
                    aria-label="Previous image"
                  >
                    &larr;
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-old-ink bg-opacity-50 text-cream hover:bg-opacity-70"
                    aria-label="Next image"
                  >
                    &rarr;
                  </button>
                </>
              )}

              <div className="date-stamp-red">
                {bench.dateVisited
                  .toLocaleDateString("en-US", {
                    year: "2-digit",
                    month: "2-digit",
                    day: "2-digit",
                  })
                  .replace(/\//g, "-")}
              </div>
            </div>
          </div>

          {bench.images && bench.images.length > 1 && (
            <div className="flex overflow-x-auto space-x-2 py-2 mb-4">
              {bench.images.map((src, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 flex-shrink-0 bg-white p-1 cursor-pointer ${
                    index === currentImageIndex ? "ring-2 ring-accent1" : ""
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    style={{ filter: "saturate(1.2)" }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="bg-newsprint p-4 border border-old-ink mb-4">
            <h3 className="font-serif text-base uppercase tracking-wider text-old-ink border-b border-old-ink pb-1 mb-2">
              Location
            </h3>
            <div className="font-mono text-sm">
              <p>Latitude: {latitude.toFixed(6)}</p>
              <p>Longitude: {longitude.toFixed(6)}</p>
              {bench.location.displayName && (
                <p className="mt-2">{bench.location.displayName}</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-2/5">
          <div className="bg-cream p-6 border border-old-ink mb-6">
            <h2 className="newspaper-headline text-xl mb-4">Bench Ratings</h2>

            {Object.entries(bench.ratings).map(([category, value]) => (
              <RatingDisplay key={category} category={category} value={value} />
            ))}
          </div>

          {bench.notes && (
            <div className="bg-yellowed-paper p-6 border border-dashed border-old-ink">
              <h2 className="newspaper-headline text-xl mb-4">Field Notes</h2>
              <div className="font-serif whitespace-pre-wrap text-old-ink">
                {bench.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BenchDetails;
