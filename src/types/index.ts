export type PlushieGender = "male" | "female" | null;

export type Plushie = {
  id: number;
  name: string;
  species: string;
  description: string;
  mature_description: string;
  manufacturer: string;
  acquired_date: string | null;
  is_favorite: boolean;
  has_stickies: boolean;
  is_imported: boolean;
  is_travel_buddy: boolean;
  is_modded: boolean;
  is_padded: boolean;
  gender: PlushieGender;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type PlushieInput = {
  name: string;
  description?: string;
  mature_description?: string;
  species?: string;
  manufacturer?: string;
  acquired_date?: string | null;
  is_favorite?: boolean;
  has_stickies?: boolean;
  is_imported?: boolean;
  is_travel_buddy?: boolean;
  is_modded?: boolean;
  is_padded?: boolean;
  gender?: PlushieGender;
  image_path?: string | null;
  remove_image?: boolean;
};

export type AuthMethod = "password" | "oidc";

export type SessionData = {
  isLoggedIn: boolean;
  username?: string;
  authMethod?: AuthMethod;
  oidc?: {
    sub: string;
    email?: string;
    name?: string;
    idToken?: string;
  };
  // Transient state used during the OIDC authorization code flow.
  oidcFlow?: {
    state: string;
    nonce: string;
    codeVerifier: string;
    redirectTo?: string;
  };
};

export type Vendor = {
  id: number;
  name: string;
  short_description: string;
  description: string;
  website_url: string;
  location: string;
  logo_path: string | null;
  is_mature: boolean;
  created_at: string;
  updated_at: string;
};

export type VendorInput = {
  name: string;
  short_description?: string;
  description?: string;
  website_url?: string;
  location?: string;
  logo_path?: string | null;
  is_mature?: boolean;
  remove_logo?: boolean;
};
