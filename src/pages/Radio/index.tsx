import React, { useEffect, useRef, useState } from "react";
import SpotifyWebApi from "../../spotify-web-api-js";
import { UMAP } from "umap-js";
import getEveryTrack from "../../Functions/getEveryTrack";
import getEveryAudioFeature from "../../Functions/getEveryAudioFeature";
import normaliseAudioFeatures from "../../Functions/normaliseAudioFeatures";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Main() {
  const spotify = new SpotifyWebApi();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [currentlyPlayingTrack, setCurrentlyPlayingTrack] = useState<SpotifyApi.TrackObjectFull | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const UMAPFITTING = async (data: number[][], allTracks: SpotifyApi.TrackObjectFull[]) => {
    const umap = new UMAP({
      nComponents: 3,
      spread: 1.2,
      minDist: 0.1,
    });
    const embeddings = await umap.fitAsync(data);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800);
    const renderer = new THREE.WebGLRenderer();

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    bodyRef.current?.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    const loader = new THREE.TextureLoader();
    const sprites = embeddings.slice(0, 1000).map((embedding, index) => {
      const track = allTracks[index];
      const texture = loader.load(track.album.images[0].url);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(embedding[0] * 10, embedding[1] * 10, embedding[2] * 10);
      sprite.scale.set(1, 1, 1);
      sprite.userData = track; // Store track info in userData
      return sprite;
    });

    sprites.forEach((sprite) => scene.add(sprite));
    camera.position.z = 50;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseUp = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(sprites);

      if (intersects.length > 0) {
        const track = intersects[0].object.userData as SpotifyApi.TrackObjectFull;
        setCurrentlyPlayingTrack(track);

        spotify.play({ uris: [track.uri] }).then(() => console.log("Playing track", track.name));
      }
    };

    window.addEventListener("mouseup", onMouseUp);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    setLoading(false);

    return () => {
      window.removeEventListener("mouseup", onMouseUp);
    };
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
    console.log("allTracks", allTracks);
    const allAudioTracks = await getEveryAudioFeature(spotify, allTracks);
    const normalised = normaliseAudioFeatures(allAudioTracks);

    UMAPFITTING(normalised, allTracks);
  };

  useEffect(() => {
    launchApp();
  }, []);

  return (
    <div className="w-screen h-screen flex" ref={bodyRef} style={{ backgroundColor: "#090f13" }}>
      <div className="w-11/12 h-40 flex rounded-md fixed inset-x-1/2 -translate-x-1/2 bottom-10" style={{ backgroundColor: "#30535F" }}>
        {loading ? "loading your music..." : `loaded your music! ${currentlyPlayingTrack?.name} is currently playing.`}
      </div>
    </div>
  );
}
