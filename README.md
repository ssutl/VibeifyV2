# VibeifyV2 
Mapping out your Spotify tracks into 3-dimensional domain, creating a visualisation of the spread of the vibes in your playlists. Using dimension reduction to reduce the large audio features of each track into x,y and z coordinates and plotting them using three.JS.



# Technologies Used
### Frontend
1. Next.js
2. Tailwind
3. Three,js

### API
1. Spotify API
   
# Features Implemented
1. UMAP - Dimensionality reductions

# How it works
Using the SpotifyAPI to grab users tracks, and all related audio features. Embeddings are created from the audio features for each track. The embeddings represent a sprite which have the track album cover as their material.


# How to run application<br/>
### Setup
1.Go to the (spotify developer dashboard)[https://developer.spotify.com/dashboard] and create a new app, ensure the redirect URI is `http://localhost:3000/Radio/`
2. You can access your Client ID here
3. Create an `.env.local` file in the root directory
4. Add `NEXT_PUBLIC_SPOTIFY_CLIENT_ID=Your spotify app key`
5. Add `NEXT_PUBLIC_SPOTIFY_SCOPE==user-read-private user-read-email user-library-read playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-modify-playback-state user-read-currently-playing user-read-playback-state user-read-recently-played`
6. Add `NEXT_PUBLIC_SPOTIFY_REDIRECT=http://localhost:3000/Radio/`

![image](https://github.com/ssutl/vibeify_v2/assets/76885270/73411b9f-dfa9-428f-a4bb-72ab0c69d0c7)



### Frontend
1. `Run NPM I` (to install needed dependencies)
2. `npm run dev`
