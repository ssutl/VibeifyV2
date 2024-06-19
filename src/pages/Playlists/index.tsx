import React, { useEffect, useState } from "react";
import SpotifyWebAPI from "../../spotify-web-api-js";
import TSNE from "tsne-js";
var spotify = new SpotifyWebAPI();

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

const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests

export default function Main({}: Props) {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [allTracks, setAllTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);

  const [allTracksLoaded, setAllTracksLoaded] = useState(false);
  const [allAudioFeatures, setAllAudioFeatures] = useState<
    SpotifyApi.AudioFeaturesObject[]
  >([]);
  const [allAudioFeaturesLoaded, setAllAudioFeaturesLoaded] = useState(false);
  const [mergedArray, setMergedArray] = useState<any[]>([]); // Updated type

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

  const processQueue = async (queue: any[], delay: number) => {
    for (const request of queue) {
      await request();
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  };

  const getEverySingleTrack = async () => {
    spotify.getUserPlaylists().then((playlists) => {
      const promises: any[] = [];
      playlists.items
        .filter((eachPlaylist) => eachPlaylist.tracks.total !== 0)
        .forEach((eachPlaylist) => {
          // Getting all songs in your playlist
          const totalTrackCount = eachPlaylist.tracks.total;
          let currentTrackCount = 0;
          while (currentTrackCount < totalTrackCount) {
            // Creating a promise for each 100 songs in the playlist
            promises.push(() =>
              spotify
                .getPlaylistTracks(eachPlaylist.id, {
                  limit: 100,
                  offset: currentTrackCount,
                })
                .then((tracks) => {
                  tracks.items.forEach((eachTrack) => {
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

      // Process the queue with rate limiting
      processQueue(promises, RATE_LIMIT_DELAY).then(() => {
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
      promises.push(() =>
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

    // Process the queue with rate limiting
    processQueue(promises, RATE_LIMIT_DELAY).then(() => {
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

      // Need to transform all the audio features from their default range to a range of 0-1. so each feature is comparable and contributes equally to the distance calculation
      type FeatureName = (typeof featureNames)[number]; // Create a type from the array elements

      const featureRanges: {
        [key in FeatureName]: { min: number; max: number };
      } = {} as { [key in FeatureName]: { min: number; max: number } };

      featureNames.forEach((eachFeature) => {
        const certainFeatureArray: any[] = mergedArray
          .filter((eachTrack) => eachTrack.audioFeatures)
          .map((eachTrack) => eachTrack.audioFeatures[eachFeature])
          .filter((eachValue) => typeof eachValue === "number");

        featureRanges[eachFeature] = {
          min: Math.min(...certainFeatureArray),
          max: Math.max(...certainFeatureArray),
        };
      });

      const normalisedArray = mergedArray
        .filter((eachTrack) => eachTrack.audioFeatures)
        .map((eachTrack) => {
          const normalisedAudioFeatures: {
            [key in FeatureName]: number;
          } = {} as { [key in FeatureName]: number };

          featureNames.forEach((eachFeature) => {
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

      model.init({
        data: non_reduced_coordinate_array,
        type: "dense",
      });

      let [error, iter] = model.run();

      // rerun without re-calculating pairwise distances, etc.
      let [error1, iter1] = model.rerun();

      // `output` is unpacked ndarray (regular nested javascript array)
      let output = model.getOutput();

      // `outputScaled` is `output` scaled to a range of [-1, 1]
      let outputScaled = model.getOutputScaled();
      console.log("outputScaled", outputScaled);
    }
  }, [allAudioFeaturesLoaded, allTracksLoaded]);

  if (!mergedArray.length) return <div>Loading...</div>;

  return (
    <div>
      <h1>Ready to visualise</h1>
    </div>
  );
}
