// Exact Malayalam channel names to filter from the M3U playlist
// Add the EXACT channel names as they appear in the playlist here
export const malayalamChannelNames = [
  // Popular Malayalam channels - ADD EXACT NAMES FROM THE PLAYLIST BELOW
  // Example: "Asianet News", "Flowers TV", "Surya TV", etc.

  // Asianet channels
  'Asianet',
  'Asianet HD',
  'Asianet News',
  'Asianet Plus',
  'Asianet Movies',

  // Surya/Sun Network Malayalam
  'Surya TV',
  'Surya HD',
  'Surya Comedy',
  'Surya Movies',

  // Manorama
  'Mazhavil Manorama',
  'Mazhavil Manorama HD',

  // Flowers TV
  'Flowers TV',
  'Flowers Comedy',

  // Kairali
  'Kairali TV',
  'Kairali News',
  'Kairali People',
  'Kairali We',

  // Jaihind
  'Jaihind TV',

  // Amrita
  'Amrita TV',

  // MediaOne
  'MediaOne TV',
  'Media One',

  // Mathrubhumi
  'Mathrubhumi News',

  // Reporter
  'Reporter TV',

  // Safari
  'Safari TV',

  // Mangalam
  'Mangalam TV',

  // News18 Kerala
  'News18 Kerala',

  // 24 News Kerala (specific Kerala ones only)
  '24 News Kerala',

  // Other Malayalam channels
  'Kerala Vision',
  'Darshana TV',
  'Goodness TV',
  'Powervision TV',
  'Shalom TV',
  'Harvest TV',
  'Jeevan TV',
];

/**
 * Check if a channel name exactly matches Malayalam channel names
 * Uses partial matching to handle variations like "Asianet HD (1080p)"
 */
export function isMalayalamChannel(channelName: string): boolean {
  const lowerName = channelName.toLowerCase().trim();

  return malayalamChannelNames.some(malayalamName => {
    const lowerMalayalamName = malayalamName.toLowerCase();

    // Check if channel name starts with the Malayalam channel name
    // This handles cases like "Asianet HD (1080p)" matching "Asianet HD"
    return lowerName.startsWith(lowerMalayalamName) ||
           lowerName.includes(` ${lowerMalayalamName} `) ||
           lowerName === lowerMalayalamName;
  });
}
