export type Role = "student" | "restaurant";

export interface Profile {
  id: string;
  role: Role;
  username: string | null;
  email: string | null;
  full_name: string | null;
  // student fields
  location: string | null;
  diet_preference: string | null;
  // restaurant fields
  restaurant_name: string | null;
  area: string | null;
  created_at: string;
  updated_at: string;
}
