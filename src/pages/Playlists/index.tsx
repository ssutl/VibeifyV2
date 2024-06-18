import React, { use, useEffect, useState } from "react";
import SpotifyWebAPI from "../../spotify-web-api-js";
import { loadSequence } from "../helpers/LoadSequence";
var spotify = new SpotifyWebAPI();

type Props = {};

export default function Main({}: Props) {
  const [mergedArray, setMergedArray] =
    useState<SpotifyApi.TrackObjectFull[]>();

  useEffect(() => {
    const getData = async () => {
      const mergedData = await loadSequence();
      setMergedArray(mergedData);
    };

    getData();
  }, []);

  if (!mergedArray) return <div>Loading...</div>;

  return (
    <div>
      <h1>Ready to visualise</h1>
    </div>
  );
}
