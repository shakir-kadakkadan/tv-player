https://tvtvtv.web.app

# TV Player - M3U Playlist Web Player

A web-based video player optimized for TV viewing with M3U playlist support. Easy navigation with TV remote controls.

## Features

- 📺 TV-optimized interface
- 🎮 Full TV remote control support (arrow keys, Enter, Backspace)
- 📋 M3U playlist support
- 🎬 Multiple playlists (Sports, News, Entertainment, Kids, Music)
- ⌨️ Keyboard navigation
- 🎯 Focus-based UI for easy navigation
- 📱 Responsive design

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

### Navigation

- **Arrow Up/Down**: Navigate through playlists or channels
- **Enter**: Select playlist or channel
- **Backspace/Escape**: Go back to previous screen
- **Space**: Play/Pause video
- **Arrow Left/Right**: Seek backward/forward (10 seconds)
- **Arrow Up/Down** (in player): Adjust volume
- **F**: Toggle fullscreen

### Structure

1. **Playlist List**: Shows available playlists (currently hardcoded)
2. **Channels**: Shows channels from selected playlist
3. **Video Player**: Plays the selected channel with full controls

## Customization

### Adding Your Own Playlists

Edit [src/pages/PlaylistList.tsx](src/pages/PlaylistList.tsx) to modify the hardcoded playlists:

```typescript
const playlists: Playlist[] = [
  {
    id: '1',
    name: 'Your Playlist Name',
    url: 'https://your-playlist-url.m3u',
    thumbnail: '🎬',
  },
  // Add more playlists...
];
```

### Adding Channels

Edit [src/pages/Channels.tsx](src/pages/Channels.tsx) to modify the channels for each playlist.

## Project Structure

```
tv-player/
├── src/
│   ├── pages/
│   │   ├── PlaylistList.tsx  # Playlist selection page
│   │   ├── Channels.tsx       # Channel selection page
│   │   └── VideoPlayer.tsx    # Video player page
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                # Main app component with routing
│   ├── main.tsx               # App entry point
│   └── index.css              # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## License

MIT
