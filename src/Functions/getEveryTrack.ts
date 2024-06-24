import SpotifyWebApi from "../spotify-web-api-js";
import ApiError from "./ApiError";

export default async function getEveryTrack(spotify: SpotifyWebApi.SpotifyWebApiJs) {
  const allTracks: SpotifyApi.TrackObjectFull[] = [];

  try {
    // Grabbing all user playlists
    const allPlaylists = await spotify.getUserPlaylists();

    for (const eachPlaylist of allPlaylists.items) {
      if (eachPlaylist.tracks.total === 0) continue;

      const totalTrackCount = eachPlaylist.tracks.total;
      let currentTrackCount = 0;

      while (currentTrackCount < totalTrackCount) {
        await new Promise<void>((resolve) => {
          setTimeout(async () => {
            try {
              const chunkOfPlaylistTracks = await spotify.getPlaylistTracks(eachPlaylist.id, {
                limit: 100,
                offset: currentTrackCount,
              });

              chunkOfPlaylistTracks.items
                .filter((eachTrack) => eachTrack.track !== null)
                .filter((eachTrack) => eachTrack.track.type == "track")
                .forEach((eachTrack) => {
                  allTracks.push(eachTrack.track as SpotifyApi.TrackObjectFull);
                });

              currentTrackCount += 100;
              resolve();
            } catch (err) {
              ApiError();
              resolve(); // Resolve the promise to prevent the loop from being stuck
            }
          }, 50); // Delay between each batch
        });
      }
    }

    // Just removing those sideloaded tracks
    const cleanedTracks = allTracks.filter((eachTrack) => eachTrack.album.images[0]);

    return cleanedTracks;
  } catch (err) {
    ApiError();
    return []; // Return an empty array or handle accordingly
  }
}
