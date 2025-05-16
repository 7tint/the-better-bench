import React from "react";

interface RatingDisplayProps {
  category: string;
  value: number | string;
  maxValue?: number;
}

const ensureNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  category,
  value,
  maxValue = 10,
}) => {
  const isTextRating = typeof value === "string" && isNaN(Number(value));

  const numericValue = isTextRating ? null : ensureNumber(value);

  return (
    <div className="mb-4">
      <h3 className="font-serif text-base uppercase tracking-wider text-old-ink border-b border-old-ink pb-1 mb-2">
        {category}
      </h3>
      {isTextRating ? (
        <div className="pl-3 border-l-3 border-accent3 italic font-serif">
          "{value}"
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-sm text-old-ink">{value}</span>
            <span className="font-mono text-xs text-old-ink">
              out of {maxValue}
            </span>
          </div>
          {numericValue !== null && (
            <div className="h-4 w-full bg-newsprint relative">
              <div
                className="h-full bg-accent1"
                style={{ width: `${(numericValue / maxValue) * 100}%` }}
              ></div>
              <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-between pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="h-full w-px bg-old-ink opacity-20"
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;
