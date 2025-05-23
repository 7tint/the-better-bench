import React, { useState, useRef, useEffect } from "react";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../../services/firebase";
import { isOnline, saveOfflineEntry } from "../../services/offlineStorage";
import { v4 as uuidv4 } from "uuid";
import type { BenchEntry } from "../../types";

interface BenchFormProps {
  bench?: Partial<BenchEntry>;
  onSubmit: (benchData: Partial<BenchEntry>) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

const BenchForm: React.FC<BenchFormProps> = ({
  bench,
  onSubmit,
  isOpen,
  onClose,
}) => {
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

  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
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
      setPreviewImages([]);
      setActiveImageIndex(0);
      setRatingTypes({
        design: "number",
        comfort: "number",
        scenery: "number",
        bonus: "number",
        overall: "number",
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (bench && isOpen) {
      setFormData({
        ...bench,
        location: bench.location || {
          latitude: 0,
          longitude: 0,
        },
        ratings: bench.ratings || {
          design: 5,
          comfort: 5,
          scenery: 5,
          bonus: 5,
          overall: 5,
        },
      });

      setPreviewImages(bench.images || []);

      const newRatingTypes: Record<string, "number" | "text"> = {};
      if (bench.ratings) {
        Object.entries(bench.ratings).forEach(([key, value]) => {
          newRatingTypes[key] = typeof value === "string" ? "text" : "number";
        });
        setRatingTypes(newRatingTypes);
      }
    }
  }, [bench, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

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
    const initialLength = newPreviewImages.length;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviewImages.push(e.target.result as string);
          setPreviewImages(newPreviewImages);
          if (initialLength === 0 && newPreviewImages.length === 1) {
            setActiveImageIndex(0);
          }
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
      const imageUrls = await Promise.all(
        previewImages.map(async (imageData) => {
          if (!isOnline() && imageData.startsWith("data:")) {
            return imageData;
          }

          if (!imageData.startsWith("data:")) {
            return imageData;
          }

          const imageId = uuidv4();
          const imageExtension =
            imageData.split(";")[0].split("/")[1] || "jpeg";
          const filename = `bench-images/${
            formData.id || "new"
          }-${imageId}.${imageExtension}`;

          const storageRef = ref(storage, filename);

          const snapshot = await uploadString(
            storageRef,
            imageData,
            "data_url"
          );

          const downloadUrl = await getDownloadURL(snapshot.ref);
          return downloadUrl;
        })
      );

      const updatedFormData = {
        ...formData,
        images: imageUrls,
      };

      if (isOnline()) {
        await onSubmit(updatedFormData);
      } else {
        const tempId = await saveOfflineEntry(updatedFormData);
        console.log(`Saved bench entry offline with temporary ID: ${tempId}`);

        await onSubmit({
          ...updatedFormData,
          id: tempId,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving bench:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-opacity-75 bg-old-ink flex items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg transform bg-paper transition-all max-h-[95vh] overflow-y-auto"
      >
        <div className="px-4 py-3 border-b border-old-ink sticky top-0 bg-paper z-10">
          <div className="flex justify-between items-center">
            <button type="button" onClick={onClose} className="text-old-ink">
              &larr;
            </button>
            <h2 className="font-serif text-xl text-old-ink text-center flex-grow">
              {formData.id ? "Edit" : "New"} Bench Entry
            </h2>
            <div className="w-4"></div>
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

          <div className="mb-4">
            <label className="block font-serif text-sm uppercase tracking-wider text-old-ink mb-1">
              Location
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-old-ink mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="location.latitude"
                  value={formData.location?.latitude || 0}
                  onChange={handleChange}
                  className="w-full p-2 font-mono text-sm bg-cream border border-old-ink focus:outline-none focus:ring-1 focus:ring-accent1"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-old-ink mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="location.longitude"
                  value={formData.location?.longitude || 0}
                  onChange={handleChange}
                  className="w-full p-2 font-mono text-sm bg-cream border border-old-ink focus:outline-none focus:ring-1 focus:ring-accent1"
                />
              </div>
            </div>
            <a
              target="_blank"
              href="https://www.gps-coordinates.net/my-location"
              className="mt-1 font-mono text-xs text-old-ink italic"
            >
              https://www.gps-coordinates.net/my-location
            </a>
          </div>

          <div className="mb-6">
            <label className="block font-serif text-sm uppercase tracking-wider text-old-ink mb-1">
              Photographs
            </label>

            <div className="viewfinder mb-2 bg-black relative aspect-[4/3]">
              {previewImages.length > 0 ? (
                <img
                  src={previewImages[activeImageIndex]}
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
                    className={`w-16 h-16 flex-shrink-0 bg-white p-1 cursor-pointer ${
                      index === activeImageIndex ? "ring-2 ring-accent1" : ""
                    }`}
                    onClick={() => setActiveImageIndex(index)}
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
              <div
                key={category}
                className="mb-4 pb-3 border-b border-newsprint"
              >
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
                      <span className="font-mono text-xs text-old-ink">
                        /10
                      </span>
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
            {loading ? "Developing..." : formData.id ? "Update" : "Publish"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BenchForm;
