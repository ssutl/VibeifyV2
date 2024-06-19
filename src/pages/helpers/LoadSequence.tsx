import SpotifyWebAPI from "../../spotify-web-api-js";
var spotify = new SpotifyWebAPI();

export const loadSequence = async () => {
  const getEverySingleTrackEver = async (): Promise<
    SpotifyApi.TrackObjectFull[]
  > => {
    let allTracks: SpotifyApi.TrackObjectFull[] = [];
    const playlists = await spotify.getUserPlaylists();
    const promises: Promise<any>[] = [];

    await Promise.all(
      playlists.items
        .filter((eachPlaylist) => eachPlaylist.tracks.total !== 0)
        .map(async (eachPlaylist) => {
          const totalTrackCount = eachPlaylist.tracks.total;
          let currentTrackCount = 0;

          while (currentTrackCount < totalTrackCount) {
            promises.push(
              spotify
                .getPlaylistTracks(eachPlaylist.id, {
                  limit: 100,
                  offset: currentTrackCount,
                })
                .then((tracks) => {
                  tracks.items.forEach((eachTrack) => {
                    if ("track" in eachTrack && eachTrack.track !== null) {
                      allTracks.push(
                        eachTrack.track as SpotifyApi.TrackObjectFull
                      );
                    }
                  });
                })
            );
            currentTrackCount += 100;
          }
        })
    );

    await Promise.all(promises);
    return allTracks;
  };

  const getEveryAudioFeature = async (
    everyTrack: SpotifyApi.TrackObjectFull[]
  ): Promise<SpotifyApi.AudioFeaturesObject[]> => {
    let bottomPointer = 0;
    let topPointer = 100;
    const promises: Promise<any>[] = [];
    const audioFeatureArray: SpotifyApi.AudioFeaturesObject[] = [];

    const stringArray = everyTrack
      .filter((eachTrack) => eachTrack !== null)
      .map((eachTrack) => eachTrack.id);

    while (bottomPointer < everyTrack.length) {
      const chunk = stringArray.slice(bottomPointer, topPointer);
      promises.push(
        spotify.getAudioFeaturesForTracks(chunk).then((results) => {
          audioFeatureArray.push(...results.audio_features);
        })
      );

      bottomPointer += 100;
      topPointer += 100;
    }

    await Promise.all(promises);
    return audioFeatureArray;
  };

  const mergeArrays = (
    everyTrack: SpotifyApi.TrackObjectFull[],
    everyAudioFeature: SpotifyApi.AudioFeaturesObject[]
  ) => {
    return everyTrack
      .filter((eachTrack) => eachTrack !== null)
      .map((eachTrack) => {
        const audioFeature = everyAudioFeature
          .filter((eachAudioFeature) => eachAudioFeature !== null)
          .find(
            (eachAudioFeature) => eachAudioFeature.id === eachTrack.id
          ) as SpotifyApi.AudioFeaturesObject;
        return {
          ...eachTrack,
          audioFeatures: audioFeature,
        };
      });
  };

  const getTokenFromUrl = async () => {
    const accessTokenIndex = window.location.href.indexOf("access_token=");
    const ampIndex = window.location.href.indexOf("&", accessTokenIndex);
    const accessToken = window.location.href.substring(
      accessTokenIndex + "access_token=".length,
      ampIndex
    );
    return accessToken;
  };

  const token = await getTokenFromUrl();
  spotify.setAccessToken(token);

  const tracks: SpotifyApi.TrackObjectFull[] = await getEverySingleTrackEver();
  const audioFeatures: SpotifyApi.AudioFeaturesObject[] =
    await getEveryAudioFeature(tracks);

  return mergeArrays(tracks, audioFeatures);
};
