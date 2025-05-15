import React from "react";
import { Link } from "react-router-dom";
import type { BenchEntry } from "../../types";

interface BenchCardProps {
  bench: BenchEntry;
}

const BenchCard: React.FC<BenchCardProps> = ({ bench }) => {
  // Format date to look like a film camera date stamp
  const formatDateStamp = (date: Date) => {
    return date
      .toLocaleDateString("en-US", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-");
  };

  return (
    <Link to={`/bench/${bench.id}`}>
      <div className="relative mb-8 transform transition hover:-rotate-1 hover:scale-102">
        <div className="bg-white p-3 pb-16 shadow-polaroid">
          <div className="relative overflow-hidden aspect-[4/3]">
            {bench.images && bench.images.length > 0 ? (
              <img
                src={bench.images[0]}
                alt={bench.name}
                className="w-full h-full object-cover"
                style={{
                  filter: "saturate(1.2) contrast(1.1)", // Slightly oversaturated like disposable camera, TODO: think of better?
                }}
              />
            ) : (
              <div className="w-full h-full bg-newsprint flex items-center justify-center">
                <span className="font-mono text-old-ink">No Image</span>
              </div>
            )}

            <div className="date-stamp">
              {formatDateStamp(bench.dateVisited)}
            </div>

            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-flash to-transparent opacity-50"></div>
          </div>

          <div className="absolute bottom-2 left-3 right-3 text-center">
            <p className="font-serif text-sm text-old-ink leading-tight">
              {bench.name}
            </p>
            <div className="flex justify-center items-center mt-1">
              <span className="text-xs font-mono text-filmRed mr-1">
                RATING:
              </span>
              <span className="text-sm font-mono text-old-ink">
                {bench.ratings.overall}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-gray-100 bg-opacity-60 rounded"></div>
      </div>
    </Link>
  );
};

export default BenchCard;
