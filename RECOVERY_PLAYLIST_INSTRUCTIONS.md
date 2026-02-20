# How to Import Recovery Playlist Videos

Since YouTube blocks automated access, you need to manually extract the video IDs from the playlist.

## Quick Method (Recommended)

1. Visit the playlist: https://youtube.com/playlist?list=PLtAXzvuI-cJdbNMBGE9bmsdHFpjNzwZAP

2. Right-click anywhere on the page and select "View Page Source" (or press Ctrl+U)

3. Search for "videoId" in the page source (Ctrl+F)

4. You'll see lines like: `"videoId":"ABC123xyz"`

5. Copy each video ID and paste it into the `import-recovery-playlist.js` file

## Manual Method

For each video in the playlist:

1. Click on the video to play it
2. Look at the URL: `https://youtube.com/watch?v=ABC123xyz`
3. Copy the part after `v=` (that's the video ID)
4. Also copy the video title
5. Add it to the videos array in `import-recovery-playlist.js`

## Format

Each video entry should look like this:

```javascript
{
  title: "The actual video title",
  description: "Recovery and sobriety motivation content",
  youtubeId: "ABC123xyz",  // Replace with actual ID
  category: "recovery_motivation",
},
```

## Run the Import

Once you've added all the video IDs:

```bash
node import-recovery-playlist.js
```

## Need Help?

If you get the video IDs but don't want to manually format them, paste them here and I can update the import script for you.
