import SpotifyWebApi from "../spotify-web-api-js";
import ApiError from "./ApiError";

export default async function getEveryTrack(spotify: SpotifyWebApi.SpotifyWebApiJs) {
  const allTracks: SpotifyApi.TrackObjectFull[] = [];

  // Grabbing all user playlists
  const allPlaylists = await spotify.getUserPlaylists();

  try {
    for (const eachPlaylist of allPlaylists.items) {
      if (eachPlaylist.tracks.total === 0) continue;

      const totalTrackCount = eachPlaylist.tracks.total;
      let currentTrackCount = 0;

      while (currentTrackCount < totalTrackCount) {
        await new Promise<void>((resolve) => {
          setTimeout(async () => {
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
          }, 50); // Delay between each batch
        });
      }
    }
  } catch (e) {
    ApiError();
  }

  //Just removing those sideloaded tracks
  const cleanedTracks = allTracks.filter((eachTrack) => eachTrack.album.images[0]);

  return cleanedTracks;
}
