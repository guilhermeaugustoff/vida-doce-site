export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category_id: number;
  category_name?: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
}
