export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  image_url: string;
  category_id: number;
  category_name?: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
}
