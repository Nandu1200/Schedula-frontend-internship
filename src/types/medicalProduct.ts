export type MedicalProductCategory =
  | "medicines"
  | "vitamins"
  | "wellness"
  | "medical-devices"
  | "personal-care";

export type MedicalProduct = {
  id: string;
  name: string;
  category: MedicalProductCategory;
  brand: string;
  description: string;
  packSize: string;
  price: number;
  mrp: number;
  prescriptionRequired: boolean;
  inStock: boolean;
  imageUrl?: string;
};
