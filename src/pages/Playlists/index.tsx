import React, { useState, useEffect } from "react";
import SpotifyWebApi from "../../spotify-web-api-js";
import { UMAP } from "umap-js";

const featureNames = ["acousticness", "danceability", "duration_ms", "energy", "instrumentalness", "key", "liveness", "loudness", "mode", "speechiness", "tempo", "time_signature", "valence"] as const;

// const data5 = [
//   [0.6720492646153009, 0.8216151122171005, 0.13868312438482788, 0.38899941102304525],
//   [0.9129865959632102, 0.2936409418475907, 0.6154111917689415, 0.4635251313709843],
//   [0.6861988625183544, 0.31820136702826884, 0.7225002377138481, 0.403269953437561],
//   [0.33282214914435904, 0.16669322207433734, 0.6173925258097848, 0.1527621241879631],
//   [0.9358325009499096, 0.729836036017744, 0.8348641996230082, 0.3723601327472479],
//   [0.6279081303319196, 0.009118317498206796, 0.5613718244081021, 0.006128018929973722],
//   [0.3494750071858872, 0.5427698875217959, 0.2694591989255226, 0.2923241280297373],
//   [0.9403886788419331, 0.017125933450291342, 0.5339484794234299, 0.3737767727526944],
//   [0.12077400551866413, 0.20523076774951554, 0.16522002227931587, 0.21519782107298946],
//   [0.8841453786221722, 0.10759315583572016, 0.6072249872068218, 0.7284770284406465],
//   [0.03229548469781407, 0.86752836973747, 0.1504870582519433, 0.6157334322066368],
//   [0.641169443270134, 0.7574413979394585, 0.024261401940406158, 0.6571748777908795],
//   [0.751457742573151, 0.30896379401997565, 0.5107585254711269, 0.12530981646973238],
//   [0.3177649916833989, 0.2766990920513228, 0.07494092203629288, 0.5174955299720259],
//   [0.7105732858530014, 0.7577536033614705, 0.6614996033244003, 0.21635310341472258],
//   [0.19776066234565293, 0.08974433840902774, 0.7019937745876808, 0.48125551571044567],
// ];

export default function Main() {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [everyTrack, setEveryTrack] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [everyTrackLoaded, setEveryTrackLoaded] = useState(false);
  const [audioFeatures, setAudioFeatures] = useState<SpotifyApi.AudioFeaturesObject[]>([]);
  const [audioFeaturesLoaded, setAudioFeaturesLoaded] = useState(false);
  const [completeArray, setCompleteArray] = useState<SpotifyApi.TrackObjectFullConAudioFeatures[]>();
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

  const UMAPFITTING = async (data: number[][]) => {
    const umap = new UMAP();
    const embedding = await umap.fitAsync(data, (epochNumber) => {
      // check progress and give user feedback, or return `false` to stop
    });
    console.log(embedding);
  };

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

      UMAPFITTING(non_reduced_coordinate_array);
    }
  }, [completeArray]);

  return <div></div>;
}
