import SpotifyWebAPI from "../../spotify-web-api-js";
var spotify = new SpotifyWebAPI();

export const loadSequence = async () => {
  const getEverySingleTrackEver = async () => {
    const promises: Promise<any>[] = [];
    let allTracks: SpotifyApi.TrackObjectFull[] = [];

    spotify.getUserPlaylists().then((playlists) => {
      playlists.items
        .filter((eachPlaylist) => eachPlaylist.tracks.total !== 0)
        .forEach((eachPlaylist) => {
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
        });
    });

    Promise.all(promises);
    return allTracks;
  };

  const getEveryAudioFeature = async (
    everyTrack: SpotifyApi.TrackObjectFull[]
  ) => {
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
      if (topPointer > everyTrack.length) {
        topPointer = everyTrack.length;
      }
    }

    Promise.all(promises);
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

  const tracks = await getEverySingleTrackEver();
  const audioFeatures = await getEveryAudioFeature(tracks);

  return mergeArrays(tracks, audioFeatures);
};
