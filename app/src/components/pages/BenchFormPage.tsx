import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { BenchEntry } from "../../types";

interface BenchFormPageProps {
  onSubmit: (benchData: Partial<BenchEntry>) => Promise<void>;
}

const BenchFormPage: React.FC<BenchFormPageProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const [formData, setFormData] = useState<Partial<BenchEntry>>({
    name: "",
    location: {
      latitude: 0,
      longitude: 0,
    },
    ratings: {
      design: 5,
      comfort: 5,
      scenery: 5,
      bonus: 5,
      overall: 5,
    },
    images: [],
    notes: "",
    dateVisited: new Date(),
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [ratingTypes, setRatingTypes] = useState<
    Record<string, "number" | "text">
  >({
    design: "number",
    comfort: "number",
    scenery: "number",
    bonus: "number",
    overall: "number",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBench = async () => {
      if (id) {
        try {
          const benchDoc = await getDoc(doc(db, "benches", id));
          if (benchDoc.exists()) {
            const benchData = {
              id: benchDoc.id,
              ...benchDoc.data(),
              dateVisited: benchDoc.data().dateVisited?.toDate() || new Date(),
              createdAt: benchDoc.data().createdAt?.toDate() || new Date(),
              updatedAt: benchDoc.data().updatedAt?.toDate() || new Date(),
            } as BenchEntry;

            setFormData(benchData);
            setPreviewImages(benchData.images || []);

            const newRatingTypes: Record<string, "number" | "text"> = {};
            if (benchData.ratings) {
              Object.entries(benchData.ratings).forEach(([key, value]) => {
                newRatingTypes[key] =
                  typeof value === "string" ? "text" : "number";
              });
              setRatingTypes(newRatingTypes);
            }
          }
        } catch (error) {
          console.error("Error fetching bench:", error);
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchBench();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      const parentValue = formData[parent as keyof typeof formData];
      if (parentValue && typeof parentValue === "object") {
        setFormData({
          ...formData,
          [parent]: {
            ...parentValue,
            [child]: value,
          },
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleRatingChange = (category: string, value: string) => {
    let processedValue: number | string = value;
    if (ratingTypes[category] === "number" && !isNaN(parseFloat(value))) {
      processedValue = parseFloat(value);
    }

    setFormData({
      ...formData,
      ratings: {
        ...(formData.ratings || {
          design: 5,
          comfort: 5,
          scenery: 5,
          bonus: 5,
          overall: 5,
        }),
        [category]: processedValue,
      },
    });
  };

  const toggleRatingType = (category: string) => {
    const newType = ratingTypes[category] === "number" ? "text" : "number";
    setRatingTypes({
      ...ratingTypes,
      [category]: newType,
    });

    const currentValue =
      formData.ratings?.[category as keyof typeof formData.ratings];
    let newValue: number | string;

    if (newType === "number") {
      newValue =
        typeof currentValue === "string"
          ? !isNaN(parseFloat(currentValue))
            ? parseFloat(currentValue)
            : 5
          : currentValue || 5;
    } else {
      newValue = currentValue?.toString() || "5";
    }

    handleRatingChange(category, newValue.toString());
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviewImages = [...previewImages];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviewImages.push(e.target.result as string);
          setPreviewImages(newPreviewImages);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedFormData = {
        ...formData,
        images: previewImages,
      };
      await onSubmit(updatedFormData);
    } catch (error) {
      console.error("Error saving bench:", error);
      alert("Failed to save bench. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-8">
        <p className="font-serif text-old-ink">Loading bench data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-paper">
      <div className="px-4 py-3 border-b border-old-ink bg-paper">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="text-old-ink"
          >
            &larr;
          </button>
          <h2 className="font-serif text-xl text-old-ink text-center flex-grow">
            {id ? "Edit" : "New"} Bench Entry
          </h2>
          <div className="w-4"></div> {/* Spacer for centering */}
        </div>
        <p className="font-mono text-xs text-center text-old-ink mt-1">
          {new Date().toLocaleDateString()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="mb-4">
          <label className="block font-serif text-sm uppercase tracking-wider text-old-ink mb-1">
            Bench Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            className="w-full p-2 font-mono bg-cream border border-old-ink focus:outline-none focus:ring-1 focus:ring-accent1"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block font-serif text-sm uppercase tracking-wider text-old-ink mb-1">
            Photographs
          </label>

          <div className="mb-2 bg-black relative aspect-[4/3] overflow-hidden">
            {previewImages.length > 0 ? (
              <img
                src={previewImages[0]}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "saturate(1.2) contrast(1.1)" }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <span className="text-white font-mono">No images yet</span>
              </div>
            )}

            <div className="absolute inset-0">
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white opacity-50"></div>
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white opacity-50"></div>
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white opacity-50"></div>
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white opacity-50"></div>
            </div>
          </div>

          <div className="flex justify-between">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
              multiple
            />

            <button
              type="button"
              onClick={handleTakePhoto}
              className="flex-1 py-2 mr-2 bg-film-red text-white font-mono text-sm uppercase"
            >
              Take Photo
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 bg-film-blue text-white font-mono text-sm uppercase"
            >
              Upload
            </button>
          </div>

          {previewImages.length > 0 && (
            <div className="mt-3 flex overflow-x-auto space-x-2 py-2">
              {previewImages.map((src, index) => (
                <div
                  key={index}
                  className="w-16 h-16 flex-shrink-0 bg-white p-1"
                >
                  <img
                    src={src}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                    style={{ filter: "saturate(1.2)" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="font-serif text-sm uppercase tracking-wider text-old-ink">
              Ratings
            </p>
            <p className="font-mono text-xs text-old-ink">
              tap rating type to switch
            </p>
          </div>

          {Object.entries(formData.ratings || {}).map(([category, value]) => (
            <div key={category} className="mb-4 pb-3 border-b border-newsprint">
              <div className="flex justify-between items-center mb-2">
                <label className="font-mono text-xs text-old-ink uppercase">
                  {category}
                </label>

                <button
                  type="button"
                  onClick={() => toggleRatingType(category)}
                  className="py-1 px-2 text-xs font-mono bg-newsprint text-old-ink rounded"
                >
                  {ratingTypes[category] === "number" ? "Number" : "Text"}{" "}
                  Rating
                </button>
              </div>

              {ratingTypes[category] === "number" ? (
                <div>
                  <div className="flex justify-between mb-1">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={value as number}
                      onChange={(e) =>
                        handleRatingChange(category, e.target.value)
                      }
                      className="w-16 p-1 font-mono text-sm bg-cream border border-old-ink focus:outline-none"
                    />
                    <span className="font-mono text-xs text-old-ink">/10</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={value as number}
                    onChange={(e) =>
                      handleRatingChange(category, e.target.value)
                    }
                    className="w-full h-1 bg-newsprint appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent1"
                  />
                </div>
              ) : (
                <div className="flex">
                  <input
                    type="text"
                    value={value as string}
                    onChange={(e) =>
                      handleRatingChange(category, e.target.value)
                    }
                    placeholder="e.g., Fantastic or 8.5"
                    className="flex-grow p-2 font-mono text-sm bg-cream border border-old-ink focus:outline-none"
                  />
                  <span className="ml-2 font-mono text-sm flex items-center">
                    /10
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label className="block font-serif text-sm uppercase tracking-wider text-old-ink mb-1">
            Field Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 font-mono text-sm bg-cream border border-old-ink focus:outline-none focus:ring-1 focus:ring-accent1"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-old-ink text-cream font-serif uppercase tracking-widest text-sm shadow-newspaper transform transition hover:translate-x-px hover:translate-y-px"
        >
          {loading ? "Developing..." : id ? "Update" : "Publish"}
        </button>
      </form>
    </div>
  );
};

export default BenchFormPage;
