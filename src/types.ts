export interface Employee {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface Material {
  id: string;
  name: string;
  price: number;
}

export interface WorkRecord {
  id: string;
  employeeId: string;
  itemId: string; // productId or materialId
  itemType: 'product' | 'material';
  quantity: number;
  date: string; // YYYY-MM-DD
  remarks?: string;
}

export interface AppData {
  employees: Employee[];
  products: Product[];
  materials: Material[];
  records: WorkRecord[];
}
