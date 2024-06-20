import React, { useState, useEffect } from "react";
import SpotifyWebApi from "../../spotify-web-api-js";
import * as tf from "@tensorflow/tfjs";
import { tsne } from "@tensorflow/tfjs-tsne";
import { Scatter } from "react-chartjs-2";
import "chart.js/auto";

const featureNames = ["acousticness", "danceability", "duration_ms", "energy", "instrumentalness", "key", "liveness", "loudness", "mode", "speechiness", "tempo", "time_signature", "valence"] as const;

export default function Main() {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [everyTrack, setEveryTrack] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [everyTrackLoaded, setEveryTrackLoaded] = useState(false);
  const [audioFeatures, setAudioFeatures] = useState<SpotifyApi.AudioFeaturesObject[]>([]);
  const [audioFeaturesLoaded, setAudioFeaturesLoaded] = useState(false);
  const [completeArray, setCompleteArray] = useState<SpotifyApi.TrackObjectFullConAudioFeatures[]>();
  const [coordinates, setCoordinates] = useState<any[]>([]);
  console.log("coordinates", coordinates);
  const spotify = new SpotifyWebApi();

  const getTokenFromUrl = () => {
    const accessTokenIndex = window.location.href.indexOf("access_token=");
    const ampIndex = window.location.href.indexOf("&", accessTokenIndex);
    const accessToken = window.location.href.substring(accessTokenIndex + "access_token=".length, ampIndex);
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
                      setEveryTrack((everyTrack: any) => [...everyTrack, eachTrack.track]);
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

      const stringArray = everyTrack.filter((eachTrack) => eachTrack !== null).map((eachTrack) => eachTrack.id);

      while (bottomPointer < everyTrack.length) {
        const chunk = stringArray.slice(bottomPointer, topPointer);
        promises.push(
          spotify.getAudioFeaturesForTracks(chunk).then((results) => {
            setAudioFeatures((audioFeatures) => [...audioFeatures, ...results.audio_features]);
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
          const obj2 = audioFeatures.filter((eachAudioFeature) => eachAudioFeature !== null).find((o) => o.id === obj1.id);
          return { ...obj1, audioFeatures: obj2 };
        })
        .filter((eachTrack): eachTrack is SpotifyApi.TrackObjectFullConAudioFeatures => eachTrack !== null)
        .filter((eachTrack) => eachTrack.audioFeatures !== undefined);

      setCompleteArray(mergedArray);
    }
  }, [audioFeaturesLoaded, everyTrackLoaded]);

  useEffect(() => {
    if (completeArray) {
      const featureRanges: {
        [key in (typeof featureNames)[number]]: { min: number; max: number };
      } = {} as any;

      featureNames.forEach((feature) => {
        const values = completeArray
          .filter((eachTrack) => eachTrack.audioFeatures !== undefined)
          .map((track) => track.audioFeatures[feature])
          .filter((value) => typeof value === "number");
        featureRanges[feature] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      });

      const normalisedArray = completeArray
        .filter((eachTrack) => eachTrack.audioFeatures !== undefined)
        .map((track) => {
          const normalisedAudioFeatures: {
            [key in (typeof featureNames)[number]]: number;
          } = {} as any;

          featureNames.forEach((feature) => {
            normalisedAudioFeatures[feature] = (track.audioFeatures[feature] - featureRanges[feature].min) / (featureRanges[feature].max - featureRanges[feature].min);
          });

          return {
            ...track,
            audioFeatures: normalisedAudioFeatures,
          };
        });

      const non_reduced_coordinate_array = normalisedArray.map((track) => Object.values(track.audioFeatures).filter((value) => typeof value === "number"));

      // Convert the data to a TensorFlow tensor
      const dataTensor = tf.tensor2d(non_reduced_coordinate_array.slice(0, 100));

      // Initialize the TSNE optimizer
      const tsneOpt = tsne(dataTensor);

      tsneOpt.compute().then(async () => {
        // tsne.coordinate returns a *tensor* with x, y coordinates of
        // the embedded data.
        const coordinatesArray = await tsneOpt.coordsArray();
        setCoordinates(coordinatesArray);
      });
    }
  }, [completeArray]);

  return (
    <div>
      {coordinates.length > 0 && (
        <Scatter
          data={{
            datasets: [
              {
                label: "t-SNE Embedding",
                data: coordinates.map((coord) => ({ x: coord[0], y: coord[1] })),
                backgroundColor: "rgba(75,192,192,1)",
              },
            ],
          }}
          options={{
            scales: {
              x: {
                type: "linear",
                position: "bottom",
              },
              y: {
                type: "linear",
                position: "left",
              },
            },
          }}
        />
      )}
    </div>
  );
}
