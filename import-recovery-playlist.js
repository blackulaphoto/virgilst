import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

console.log('\n🎥 Importing Recovery Playlist videos...\n');

// Recovery Playlist videos from https://youtube.com/playlist?list=PLtAXzvuI-cJdbNMBGE9bmsdHFpjNzwZAP
// NOTE: You need to manually visit the playlist and extract the video IDs
// For each video in the playlist:
// 1. Click on the video
// 2. Copy the video ID from the URL (the part after v=)
// 3. Add it to this array with the title and description

// Template format (update with real video IDs):
const videos = [
  {
    title: "Recovery Video Example",
    description: "Inspirational recovery and sobriety content",
    youtubeId: "PASTE_VIDEO_ID_HERE",
    category: "recovery_motivation",
  },
  // Add more videos here - one entry per video in the playlist
  // You can copy the format above for each video
];

async function importVideos() {
  if (videos.length === 0 || videos[0].youtubeId === "PASTE_VIDEO_ID_HERE") {
    console.log('❌ No videos configured yet!\n');
    console.log('📋 Instructions:');
    console.log('1. Visit: https://youtube.com/playlist?list=PLtAXzvuI-cJdbNMBGE9bmsdHFpjNzwZAP');
    console.log('2. For each video in the playlist:');
    console.log('   - Click on the video');
    console.log('   - Copy the video ID from the URL (the part after v=)');
    console.log('   - Add it to the videos array in this file');
    console.log('\n💡 Example: https://youtube.com/watch?v=ABC123xyz would use "ABC123xyz"');
    console.log('\n⚠️  Update the videos array in this file and run again.\n');
    await sql.end();
    process.exit(1);
  }

  try {
    let added = 0;
    let skipped = 0;

    for (const video of videos) {
      const existing = await sql`
        SELECT id FROM videos WHERE youtube_id = ${video.youtubeId}
      `;

      if (existing.length > 0) {
        console.log(`⏭️  Skipping "${video.title}" - already exists`);
        skipped++;
        continue;
      }

      // Generate thumbnail URL from YouTube ID
      const thumbnailUrl = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

      await sql`
        INSERT INTO videos (
          title,
          description,
          youtube_id,
          category,
          thumbnail_url,
          is_published,
          created_at,
          updated_at
        ) VALUES (
          ${video.title},
          ${video.description},
          ${video.youtubeId},
          ${video.category},
          ${thumbnailUrl},
          true,
          NOW(),
          NOW()
        )
      `;

      console.log(`✅ Added: ${video.title}`);
      console.log(`   YouTube ID: ${video.youtubeId}\n`);
      added++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Added: ${added}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${videos.length}`);
    console.log('\n✨ Recovery playlist import complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

importVideos();
