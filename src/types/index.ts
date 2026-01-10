export interface Playlist {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group?: string;
}
