export default function normaliseAudioFeatures(audioFeatures: SpotifyApi.AudioFeaturesObject[]) {
  const featureNames = ["acousticness", "danceability", "energy", "instrumentalness", "liveness", "loudness", "speechiness", "valence", "tempo"];

  const featureRanges: {
    [key in (typeof featureNames)[number]]: { min: number; max: number };
  } = {} as any;

  // Initialize feature ranges
  featureNames.forEach((feature) => {
    featureRanges[feature] = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };
  });

  // Calculate min and max for each feature
  featureNames.forEach((feature) => {
    const values = audioFeatures.map((eachAudioObject) => eachAudioObject[feature]).filter((value) => typeof value === "number") as number[];

    featureRanges[feature] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  // Normalize the audio features
  const normalisedArray = audioFeatures.map((eachAudioObject) => {
    const normalisedAudioFeatures: { [key: string]: number } = {};

    featureNames.forEach((feature) => {
      const value = eachAudioObject[feature];
      if (typeof value === "number") {
        normalisedAudioFeatures[feature] = (value - featureRanges[feature].min) / (featureRanges[feature].max - featureRanges[feature].min);
      }
    });

    return Object.values(normalisedAudioFeatures);
  });

  return normalisedArray;
}
