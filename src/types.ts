export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  priceM: number;
  priceL: number;
  description: string;
  isAvailable: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  size: 'M' | 'L';
  ice: string;
  sugar: string;
  price: number;
  quantity: number;
}

export interface Order {
  id?: string;
  items: OrderItem[];
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: any; // Firestore Timestamp or Date ISO string
}

export interface AdminSettings {
  adminPasswordHash: string;
  isInitialized: boolean;
}
