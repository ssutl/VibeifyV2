import React, { use, useEffect, useState } from "react";
import SpotifyWebAPI from "../../spotify-web-api-js";
import TSNE from "tsne-js";
var spotify = new SpotifyWebAPI();

type Props = {};

export default function Main({}: Props) {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [allTracks, setAllTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);

  const [allTracksLoaded, setAllTracksLoaded] = useState(false);
  const [allAudioFeatures, setAllAudioFeatures] = useState<
    SpotifyApi.AudioFeaturesObject[]
  >([]);
  const [allAudioFeaturesLoaded, setAllAudioFeaturesLoaded] = useState(false);
  const [mergedArray, setmergedArray] =
    useState<SpotifyApi.TrackObjectFull[]>();

  const getTokenFromUrl = () => {
    const accessTokenIndex = window.location.href.indexOf("access_token=");
    const ampIndex = window.location.href.indexOf("&", accessTokenIndex);
    const accessToken = window.location.href.substring(
      accessTokenIndex + "access_token=".length,
      ampIndex
    );
    spotify.setAccessToken(accessToken);
    setSpotifyToken(accessToken);
  };

  const getEverySingleTrack = async () => {
    spotify.getUserPlaylists().then((playlists) => {
      const promises: any[] = [];
      playlists.items
        .filter((eachPlaylist) => eachPlaylist.tracks.total !== 0)
        .map((eachPlaylist) => {
          //Getting all songs in your playlist
          const totalTrackCount = eachPlaylist.tracks.total;
          let currentTrackCount = 0;
          while (currentTrackCount < totalTrackCount) {
            //Creating a promise for each 100 songs in the playlist
            promises.push(
              spotify
                .getPlaylistTracks(eachPlaylist.id, {
                  limit: 100,
                  offset: currentTrackCount,
                })
                .then((tracks) => {
                  tracks.items.map((eachTrack) => {
                    setAllTracks((allTracks: any) => [
                      ...allTracks,
                      eachTrack.track,
                    ]);
                  });
                })
            );
            currentTrackCount += 100;
          }
        });

      //Now we wait for all promises to be resolved
      Promise.all(promises).then(() => {
        // All elements have been added to the allTracks array
        setAllTracksLoaded(true);
      });
    });
  };

  const getEveryAudioFeature = async () => {
    let bottomPointer = 0;
    let topPointer = 100;
    const promises = [];

    const stringArray = allTracks
      .filter((eachTrack) => eachTrack !== null)
      .map((eachTrack) => eachTrack.id);

    while (bottomPointer < allTracks.length) {
      const chunk = stringArray.slice(bottomPointer, topPointer);
      promises.push(
        spotify.getAudioFeaturesForTracks(chunk).then((results) => {
          setAllAudioFeatures((audioFeatures) => [
            ...audioFeatures,
            ...results.audio_features,
          ]);
        })
      );

      bottomPointer += 100;
      topPointer += 100;
      if (topPointer > allTracks.length) {
        topPointer = allTracks.length;
      }
    }

    Promise.all(promises).then(() => {
      // All elements have been added to the allTracks array
      setAllAudioFeaturesLoaded(true);
    });
  };

  useEffect(() => {
    getTokenFromUrl();
  }, []);

  useEffect(() => {
    if (spotifyToken) {
      getEverySingleTrack();
    }
  }, [spotifyToken]);

  useEffect(() => {
    if (allTracksLoaded) {
      getEveryAudioFeature();
    }
  }, [allTracksLoaded]);

  useEffect(() => {
    if (allAudioFeaturesLoaded && allTracksLoaded) {
      const mergedArray = allTracks
        .filter((eachTrack) => eachTrack !== null)
        .map((eachTrack) => {
          const audioFeature = allAudioFeatures
            .filter((eachAudioFeature) => eachAudioFeature !== null)
            .find(
              (eachAudioFeature) => eachAudioFeature.id === eachTrack.id
            ) as SpotifyApi.AudioFeaturesObject;
          return {
            ...eachTrack,
            audioFeatures: audioFeature,
          };
        });

      const non_reduced_coordinate_array = mergedArray.map((eachTrack) => {
        if (!eachTrack.audioFeatures) return;
        return Object.values(eachTrack.audioFeatures).filter(
          (eachValue) => typeof eachValue === "number"
        );
      });

      console.log(non_reduced_coordinate_array);

      setmergedArray(mergedArray);
    }
  }, [allAudioFeaturesLoaded, allTracksLoaded]);

  if (!mergedArray) return <div>Loading...</div>;

  return (
    <div>
      <h1>Ready to visualise</h1>
    </div>
  );
}
