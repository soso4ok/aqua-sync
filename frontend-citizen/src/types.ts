export interface UserProfile {
  name: string;
  points: number;
}

export interface ReportStatus {
  id: string;
  category: string;
  date: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  description: string;
  coordinates: { lat: number; lng: number };
  imageUrl: string;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
}
