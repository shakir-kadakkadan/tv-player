import { Channel } from '../types';

export async function parseM3U(url: string): Promise<Channel[]> {
  try {
    const response = await fetch(url);
    const text = await response.text();

    const channels: Channel[] = [];
    const lines = text.split('\n');

    let currentChannel: Partial<Channel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and #EXTM3U header
      if (!line || line === '#EXTM3U') continue;

      // Parse #EXTINF line
      if (line.startsWith('#EXTINF:')) {
        // Extract metadata
        const metadata = line.substring(8); // Remove '#EXTINF:'

        // Extract logo
        const logoMatch = metadata.match(/tvg-logo="([^"]*)"/);
        const logo = logoMatch ? logoMatch[1] : undefined;

        // Extract group
        const groupMatch = metadata.match(/group-title="([^"]*)"/);
        const group = groupMatch ? groupMatch[1] : undefined;

        // Extract channel name (after the last comma)
        const nameMatch = metadata.match(/,(.*)$/);
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';

        currentChannel = {
          name,
          logo,
          group,
        };
      }
      // The next line after #EXTINF is the stream URL
      else if (currentChannel.name && (line.startsWith('http') || line.startsWith('//'))) {
        channels.push({
          id: `channel_${channels.length}`,
          name: currentChannel.name,
          url: line,
          logo: currentChannel.logo,
          group: currentChannel.group,
        });
        currentChannel = {};
      }
    }

    return channels;
  } catch (error) {
    console.error('Error parsing M3U playlist:', error);
    return [];
  }
}
