import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PlaylistList from './pages/PlaylistList';
import Channels from './pages/Channels';
import VideoPlayer from './pages/VideoPlayer';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<PlaylistList />} />
          <Route path="/playlist/:playlistId" element={<Channels />} />
          <Route path="/player/:playlistId/:channelId" element={<VideoPlayer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
