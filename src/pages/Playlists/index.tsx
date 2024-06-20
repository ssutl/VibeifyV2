import React, { useState, useEffect } from "react";
import SpotifyWebApi from "../../spotify-web-api-js";
import { UMAP } from "umap-js";
import getEveryTrack from "../../Functions/getEveryTrack";
import getEveryAudioFeature from "../../Functions/getEveryAudioFeature";
import normaliseAudioFeatures from "../../Functions/normaliseAudioFeatures";

export default function Main() {
  const spotify = new SpotifyWebApi();

  const UMAPFITTING = async (data: number[][]) => {
    const umap = new UMAP({
      nComponents: 3,
    });
    const embedding = await umap.fitAsync(data, (epochNumber) => {
      // check progress and give user feedback, or return `false` to stop
    });
    console.log(embedding);
  };

  const getTokenFromUrl = async () => {
    const accessTokenIndex = window.location.href.indexOf("access_token=");
    const ampIndex = window.location.href.indexOf("&", accessTokenIndex);
    const accessToken = window.location.href.substring(accessTokenIndex + "access_token=".length, ampIndex);

    return accessToken;
  };

  const launchApp = async () => {
    const token = await getTokenFromUrl();
    spotify.setAccessToken(token);

    const allTracks = await getEveryTrack(spotify);
    const allAudioTracks = await getEveryAudioFeature(spotify, allTracks);
    const normalised = normaliseAudioFeatures(allAudioTracks);

    UMAPFITTING(normalised);
  };

  useEffect(() => {
    launchApp();
  }, []);

  return <div></div>;
}
