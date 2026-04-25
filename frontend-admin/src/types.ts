export type ReportCategory = 'Algal Bloom' | 'Trash' | 'Discoloration' | 'Oil Sheen' | 'Other';

export interface CitizenReport {
  id: string;
  lat: number;
  lng: number;
  timestamp: string; // ISO string
  category: ReportCategory;
  description: string;
  imageUrl: string;
  isVerified: boolean; // Galileo verified
  accuracyMeters: number;
  anomalyIntersect?: string; // ID of intersected anomaly if any
}

export interface SatelliteAnomaly {
  id: string;
  lat: number;
  lng: number;
  radius: number; // meters
  type: 'Turbidity Spike' | 'NDWI Anomaly' | 'Chlorophyll-a';
  intensity: number; // 0-1
  lastDetected: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Analyst' | 'Field Officer';
  avatarUrl?: string;
  reportsReviewed: number;
}
