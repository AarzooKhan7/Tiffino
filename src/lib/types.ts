export type Role = "student" | "restaurant";

export interface Profile {
  id: string;
  role: Role;
  username: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  diet_pref: string | null;   // 'veg' | 'nonveg' | 'mix'
  created_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  area: string | null;
  base_price: number;
  serves_lunch: boolean;
  serves_dinner: boolean;
  lunch_skip_cutoff: string | null;
  dinner_skip_cutoff: string | null;
  qr_token: string | null;
  created_at: string;
}
