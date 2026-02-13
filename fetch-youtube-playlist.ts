import "dotenv/config";
import axios from "axios";

const PLAYLIST_ID = "PLtAXzvuI-cJc5EhJE5ZO2RYJU_H7FFQAu";

// We'll use a public method to fetch playlist data
// YouTube has a public RSS feed for playlists, but it's limited
// For now, let's create a structure for manual entry or use an API

async function fetchPlaylist() {
  console.log("📺 Fetching YouTube playlist...\n");
  console.log(`Playlist ID: ${PLAYLIST_ID}\n`);

  // Method 1: Try to use an open API or scraping approach
  try {
    // Using a workaround - fetch the playlist page HTML
    const response = await axios.get(
      `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      }
    );

    // Extract video data from the HTML response
    const html = response.data;

    // Look for video data in the ytInitialData JSON
    const match = html.match(/var ytInitialData = ({.*?});/);

    if (match) {
      const data = JSON.parse(match[1]);

      // Navigate through YouTube's data structure
      const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

      if (contents) {
        const videos = contents
          .filter((item: any) => item.playlistVideoRenderer)
          .map((item: any) => {
            const video = item.playlistVideoRenderer;
            return {
              title: video.title?.runs?.[0]?.text || "Unknown Title",
              videoId: video.videoId,
              duration: video.lengthText?.simpleText || "Unknown",
              thumbnail: video.thumbnail?.thumbnails?.[0]?.url || ""
            };
          });

        console.log(`✅ Found ${videos.length} videos\n`);
        console.log(JSON.stringify(videos, null, 2));
        return videos;
      }
    }

    throw new Error("Could not parse YouTube data");

  } catch (error) {
    console.error("❌ Error fetching playlist:", error);
    console.log("\n💡 Alternative: Please provide video IDs manually or use YouTube Data API");
    console.log("You can get an API key from: https://console.cloud.google.com/");
    return null;
  }
}

fetchPlaylist();
