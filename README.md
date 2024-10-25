
# 🎶 VibeifyV2

**VibeifyV2** maps your Spotify tracks in a 3D space, creating a visual spread of the vibes across your playlists. By reducing audio features into x, y, and z coordinates, each track is plotted as a point with its album cover, providing an immersive experience of your music’s vibe distribution.

https://github.com/ssutl/vibeify_v2/assets/76885270/0ea3931c-1c66-462b-acb0-17bec7af3e1d

## 🛠️ Technologies Used

### 🎨 Frontend
- Next.js
- Tailwind
- Three.js

### 🎧 API
- Spotify API

## 🌟 Features Implemented
1. **UMAP** – Dimensionality reduction for 3D mapping of tracks.

## 🚀 How it Works

Using the Spotify API, VibeifyV2 retrieves your tracks and audio features, converting them into embeddings plotted in 3D, where each track appears as a sprite with its album cover.

## 🛠️ How to Run the Application

### Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new app. Set the redirect URI to `http://localhost:3000/Radio/`.
2. Add `NEXT_PUBLIC_SPOTIFY_CLIENT_ID=YourSpotifyAppKey` in a `.env.local` file, along with:
   ```plaintext
   NEXT_PUBLIC_SPOTIFY_SCOPE=user-read-private user-read-email user-library-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-modify-playback-state user-read-currently-playing user-read-playback-state user-read-recently-played
   NEXT_PUBLIC_SPOTIFY_REDIRECT=http://localhost:3000/Radio/
   ```

![VibeifyV2 Screenshot](https://github.com/ssutl/vibeify_v2/assets/76885270/73411b9f-dfa9-428f-a4bb-72ab0c69d0c7)

### Frontend

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
