import SpotifyWebApi from "../spotify-web-api-js";
import ApiError from "./ApiError";

export default async function getEveryAudioFeature(spotify: SpotifyWebApi.SpotifyWebApiJs, everyTrack: SpotifyApi.TrackObjectFull[]) {
  let bottomPointer = 0;
  let topPointer = 100;
  const audioFeatures: SpotifyApi.AudioFeaturesObject[] = [];

  const ArrayOfTrackIDs = everyTrack.filter((eachTrack) => eachTrack !== null).map((eachTrack) => eachTrack.id);

  try {
    while (bottomPointer < everyTrack.length) {
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          try {
            const chunk = ArrayOfTrackIDs.slice(bottomPointer, topPointer);
            const chunkOfAudioFeatures = await spotify.getAudioFeaturesForTracks(chunk);

            audioFeatures.push(...chunkOfAudioFeatures.audio_features);

            bottomPointer += 100;
            topPointer += 100;
            if (topPointer > everyTrack.length) {
              topPointer = everyTrack.length;
            }
            resolve();
          } catch (err) {
            ApiError();
            resolve(); // Resolve the promise to prevent the loop from being stuck
          }
        }, 50);
      });
    }

    const cleanAudioFeatures = audioFeatures.filter((eachAudioObject) => eachAudioObject !== null);

    return cleanAudioFeatures;
  } catch (err) {
    ApiError();
    return []; // Return an empty array or handle accordingly
  }
}
