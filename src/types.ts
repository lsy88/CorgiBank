export interface Employee {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Unit Price / Piece Rate
}

export interface Material {
  id: string;
  name: string;
  price: number; // Unit Cost
}

// Legacy Record
export interface WorkRecord {
  id: string;
  employeeId: string;
  itemId: string; // productId or materialId
  itemType: 'product' | 'material';
  quantity: number;
  date: string; // YYYY-MM-DD
  remarks?: string;
}

export interface BatchProduct {
  productId: string;
  quantity: number;
  snapshotPrice: number;
}

export interface BatchMaterial {
  materialId: string;
  quantity: number;
  snapshotPrice: number;
}

export interface BatchEmployee {
  employeeId: string;
  share: number; // Weight for salary distribution (default 1)
}

export interface Batch {
  id: string;
  name: string; // e.g., "Batch-20231027-01"
  date: string;
  products: BatchProduct[];
  materials: BatchMaterial[];
  employees: BatchEmployee[];
  remarks?: string;
}

export interface LossRecord {
  id: string;
  date: string;
  type: 'material' | 'product' | 'other';
  itemId?: string; // ID of product or material if applicable
  itemName?: string; // Snapshot name or manual input
  quantity?: number;
  amount: number; // Monetary value of the loss
  reason?: string;
}

export interface AppData {
  employees: Employee[];
  products: Product[];
  materials: Material[];
  records: WorkRecord[]; // Legacy
  batches: Batch[];      // New
  losses: LossRecord[];
}
