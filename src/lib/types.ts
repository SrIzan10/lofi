export interface Song {
  fileId: string;
  artists: string;
  title: string;
  endpoint: string;
  image: string;
  duration: number; // not really used right now
  label?: string; // optional record label
  spotifyId?: string; // TODO: enforce in the future for all spotify scraped stations, unused atm.
}

export interface CHSong {
  id: number;
  fileId: number | string;
  endpoint?: string;
  artists: string;
  title: string;
  image: string;
  likes?: number;
  featured?: string;
  releaseDate?: string;
  releaseDateText?: string;
  duration?: number;
  isrc?: string;
  label?: string;
  spotifyId?: string;
  startTime?: string;
  endTime?: string;
}

export interface Preset {
  id: number;
  userId: number;
  name: string;
  backgroundId: string;
  stationId: string; // Represented as string in JSON
  atmospheres: string; // JSON stringified object
  sortOrder: number;
  key: string;
}

export interface StationMetaSocials {
  spotify: string | null;
  apple: string | null;
}

export interface StationMetaIcon {
  static: string;
}

// Structure within the base64 decoded 'meta' string for stations
export interface DecodedStationMeta {
  shortDescription: string;
  icon: StationMetaIcon;
  socials: StationMetaSocials;
}

export interface Station {
  name: string;
  id: number;
  meta?: string; // Base64 encoded JSON string (DecodedStationMeta)
}

export interface Background {
  id: string;
  name: string;
  parentId: string | null;
  landscapeUrl: string;
  portraitUrl: string;
  thumbnailUrl: string;
  sortOrder: number;
  isActive: number; // 0 or 1
}

export interface Atmosphere {
  id: string;
  name: string;
  url: string;
  sortOrder: number;
  urlMobile: string;
}

export interface ChillhopData {
  presets: Preset[];
  stations: Station[];
  backgrounds: Background[];
  atmospheres: Atmosphere[];
}

export interface BRStation {
  // database count id
  id: number;
  // actual id
  ID: string;
  order: string;
  Name: string;
  Source: string;
}
