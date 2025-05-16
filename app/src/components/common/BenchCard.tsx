import React from "react";
import { Link } from "react-router-dom";
import type { BenchEntry } from "../../types";

interface BenchCardProps {
  bench: BenchEntry;
}

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

const BenchCard: React.FC<BenchCardProps> = ({ bench }) => {
  const formatDateStamp = (date: Date | string | number | undefined) => {
    const safeDate = ensureDate(date);
    return safeDate
      .toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-");
  };

  return (
    <Link to={`/bench/${bench.id}`}>
      <div className="relative mb-8 transform transition hover:-rotate-1 hover:scale-105">
        <div className="bg-cream p-3 pb-16 shadow-polaroid border border-faded-black">
          <div className="relative overflow-hidden aspect-[4/3]">
            {bench.images && bench.images.length > 0 ? (
              <img
                src={bench.images[0]}
                alt={bench.name}
                className="w-full h-full object-cover"
                style={{
                  filter: "saturate(1.1) contrast(1.05)",
                }}
              />
            ) : (
              <div className="w-full h-full bg-newsprint flex items-center justify-center">
                <span className="font-mono text-old-ink">No Image</span>
              </div>
            )}

            <div className="date-stamp-red">
              {formatDateStamp(bench.dateVisited)}
            </div>
          </div>

          <div className="absolute bottom-2 left-3 right-3 text-center">
            <p className="font-serif text-sm text-old-ink leading-tight font-medium">
              {bench.name}
            </p>
            <div className="flex justify-center items-center mt-1">
              <span className="text-xs font-mono text-film-red mr-1 font-bold">
                RATING:
              </span>
              <span className="text-sm font-mono text-old-ink">
                {bench.ratings.overall}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-cream bg-opacity-80 rounded-sm border border-faded-black border-opacity-30"></div>
      </div>
    </Link>
  );
};

export default BenchCard;
