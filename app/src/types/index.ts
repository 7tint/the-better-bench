export interface BenchEntry {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    displayName?: string;
  };
  ratings: {
    design: number | string;
    comfort: number | string;
    scenery: number | string;
    bonus: number | string;
    overall: number | string;
  };
  images: string[]; // Array of image URLs
  notes: string;
  dateVisited: Date;
  createdAt: Date;
  updatedAt: Date;
}
