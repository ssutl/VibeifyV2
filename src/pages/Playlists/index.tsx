import React, { use, useEffect, useState } from "react";
import SpotifyWebAPI from "../../spotify-web-api-js";
import TSNE from "tsne-js";

type Props = {};

const featureNames = [
  "acousticness",
  "danceability",
  "duration_ms",
  "energy",
  "instrumentalness",
  "key",
  "liveness",
  "loudness",
  "mode",
  "speechiness",
  "tempo",
  "time_signature",
  "valence",
] as const;

let model = new TSNE({
  dim: 2,
  perplexity: 30.0,
  earlyExaggeration: 4.0,
  learningRate: 100.0,
  nIter: 1000,
  metric: "euclidean",
});

export default function Main({}: Props) {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [everyTrack, setEveryTrack] = useState<SpotifyApi.TrackObjectFull[]>(
    []
  );
  const url = "https://accounts.spotify.com/en/logout";

  const [everyTrackLoaded, setEveryTrackLoaded] = useState(false);
  const [audioFeatures, setAudioFeatures] = useState<
    SpotifyApi.AudioFeaturesObject[]
  >([]);
  const [audioFeaturesLoaded, setAudioFeaturesLoaded] = useState(false);
  const [completeArray, setCompleteArray] = useState<
    SpotifyApi.TrackObjectFullConAudioFeatures[]
  >([]);
  const spotify = new SpotifyWebAPI();

  const getTokenFromUrl = () => {
    const accessTokenIndex = window.location.href.indexOf("access_token=");
    const ampIndex = window.location.href.indexOf("&", accessTokenIndex);
    const accessToken = window.location.href.substring(
      accessTokenIndex + "access_token=".length,
      ampIndex
    );
    setSpotifyToken(accessToken);
  };

  useEffect(() => {
    getTokenFromUrl();
  }, []);

  useEffect(() => {
    if (spotifyToken) {
      spotify.setAccessToken(spotifyToken);

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
                      setEveryTrack((everyTrack: any) => [
                        ...everyTrack,
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
          // All elements have been added to the everyTrack array
          setEveryTrackLoaded(true);
        });
      });
    }
  }, [spotifyToken]);

  useEffect(() => {
    if (everyTrackLoaded) {
      let bottomPointer = 0;
      let topPointer = 100;
      const promises = [];

      const stringArray = everyTrack
        .filter((eachTrack) => eachTrack !== null)
        .map((eachTrack) => eachTrack.id);

      while (bottomPointer < everyTrack.length) {
        const chunk = stringArray.slice(bottomPointer, topPointer);
        promises.push(
          spotify.getAudioFeaturesForTracks(chunk).then((results) => {
            setAudioFeatures((audioFeatures) => [
              ...audioFeatures,
              ...results.audio_features,
            ]);
          })
        );

        bottomPointer += 100;
        topPointer += 100;
        if (topPointer > everyTrack.length) {
          topPointer = everyTrack.length;
        }
      }

      Promise.all(promises).then(() => {
        // All elements have been added to the everyTrack array
        setAudioFeaturesLoaded(true);
      });
    }
  }, [everyTrackLoaded]);

  useEffect(() => {
    if (audioFeaturesLoaded && everyTrackLoaded) {
      const mergedArray = everyTrack
        .filter((eachTrack) => eachTrack !== null)
        .map((obj1) => {
          const obj2 = audioFeatures
            .filter((eachAudioFeature) => eachAudioFeature !== null)
            .find((o) => o.id === obj1.id);

          if (!obj2) return;

          return { ...obj1, audioFeatures: obj2 };
        })
        .filter((eachTrack) => eachTrack !== undefined); // Filter out undefined elements

      setCompleteArray(
        mergedArray as SpotifyApi.TrackObjectFullConAudioFeatures[]
      ); // Cast to the correct type
    }
  }, [audioFeaturesLoaded, everyTrackLoaded]);

  useEffect(() => {
    if (completeArray) {
      //Need to transform all the audio features from their default range to a range of 0-1. so each feature is comparable and contributes equally to the distance calculation
      type FeatureName = (typeof featureNames)[number]; // Create a type from the array elements

      const featureRanges: {
        [key in FeatureName]: { min: number; max: number };
      } = {} as { [key in FeatureName]: { min: number; max: number } };

      featureNames.map((eachFeature) => {
        const certainFeatureArray: any[] = completeArray
          .filter((eachTrack) => eachTrack.audioFeatures !== undefined)
          .map((eachTrack) => eachTrack.audioFeatures[eachFeature])
          .filter((eachValue) => typeof eachValue === "number");

        featureRanges[eachFeature] = {
          min: Math.min(...certainFeatureArray),
          max: Math.max(...certainFeatureArray),
        };
      });

      const normalisedArray = completeArray
        .filter((eachTrack) => eachTrack.audioFeatures)
        .map((eachTrack) => {
          const normalisedAudioFeatures: {
            [key in FeatureName]: number;
          } = {} as { [key in FeatureName]: number };

          featureNames.map((eachFeature) => {
            normalisedAudioFeatures[eachFeature] =
              (eachTrack.audioFeatures[eachFeature] -
                featureRanges[eachFeature].min) /
              (featureRanges[eachFeature].max - featureRanges[eachFeature].min);
          });

          return {
            ...eachTrack,
            audioFeatures: normalisedAudioFeatures,
          };
        });

      const non_reduced_coordinate_array = normalisedArray.map((eachTrack) => {
        return Object.values(eachTrack.audioFeatures).filter(
          (eachValue) => typeof eachValue === "number"
        );
      });

      console.log(non_reduced_coordinate_array);

      model.init({
        data: non_reduced_coordinate_array,
        type: "dense",
      });

      let [error1, iter1] = model.run();

      // `output` is unpacked ndarray (regular nested javascript array)
      let output = model.getOutput();
      console.log("output", output);
    }
  }, [completeArray]);

  if (!completeArray) return <div>Loading...</div>;

  return (
    <div>
      <h1>Ready to visualise</h1>
    </div>
  );
}
