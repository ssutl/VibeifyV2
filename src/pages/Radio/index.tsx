import React, { useEffect, useRef, useState } from "react";
import SpotifyWebApi from "../../spotify-web-api-js";
import { UMAP } from "umap-js";
import getEveryTrack from "../../Functions/getEveryTrack";
import getEveryAudioFeature from "../../Functions/getEveryAudioFeature";
import normaliseAudioFeatures from "../../Functions/normaliseAudioFeatures";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FastForwardRoundedIcon from "@mui/icons-material/FastForwardRounded";
import FastRewindRoundedIcon from "@mui/icons-material/FastRewindRounded";
import { redirect } from "next/navigation";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
const FastAverageColor = require("fast-average-color").FastAverageColor;
import { useRouter } from "next/navigation";
import spotifyLogo from "../../SpotifyLogo/green.png";
import Image1 from "next/image";

export default function Main() {
  const spotify = new SpotifyWebApi();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [currentlyPlayingTrack, setCurrentlyPlayingTrack] = useState<SpotifyApi.TrackObjectFull | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [embeddings, setEmbeddings] = useState<number[][]>([]);
  const [allTracks, setAllTracks] = useState<SpotifyApi.TrackObjectFull[]>([]);
  const [playedTrackIndices, setPlayedTrackIndices] = useState<number[]>([]);
  const [playing, setPlaying] = useState<boolean>(false);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [controlBarColor, setControlBarColor] = useState<string>("#333");
  const url = "https://accounts.spotify.com/en/logout";
  const router = useRouter();

  const fac = new FastAverageColor();

  // Fisher-Yates shuffle algorithm
  const shuffleArrays = (array1: any[], array2: any[]) => {
    for (let i = array1.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array1[i], array1[j]] = [array1[j], array1[i]];
      [array2[i], array2[j]] = [array2[j], array2[i]];
    }
  };

  const UMAPFITTING = async (data: number[][], allTracks: SpotifyApi.TrackObjectFull[]) => {
    const umap = new UMAP({
      nComponents: 3,
      spread: 1.2,
      minDist: 0.1,
    });
    const embeddings = await umap.fitAsync(data);

    // Shuffle embeddings and tracks together
    shuffleArrays(embeddings, allTracks);

    // Take a random 1000 after shuffle
    const selectedEmbeddings = embeddings.slice(0, 1000);
    const selectedTracks = allTracks.slice(0, 1000);

    setEmbeddings(selectedEmbeddings);
    setAllTracks(selectedTracks);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer();

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    bodyRef.current?.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;

    const loader = new THREE.TextureLoader();
    const sprites = selectedEmbeddings.map((embedding, index) => {
      const track = selectedTracks[index];
      const texture = loader.load(track.album.images[0].url);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(embedding[0] * 10, embedding[1] * 10, embedding[2] * 10);
      sprite.scale.set(1, 1, 1);
      sprite.userData = { track, index }; // Store track info and index in userData
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
        const { track, index } = intersects[0].object.userData as { track: SpotifyApi.TrackObjectFull; index: number };
        playTrack(track, index);
      }
    };

    window.addEventListener("mouseup", onMouseUp);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (!controlsRef.current?.enabled) {
        scene.rotation.y += 0.001; // Slow rotation
      }
      renderer.render(scene, camera);
    };

    animate();

    setLoading(false);

    return () => {
      window.removeEventListener("mouseup", onMouseUp);
    };
  };

  const calculateDistance = (a: number[], b: number[]): number => {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  };

  const getNextClosestTrackIndex = (currentEmbedding: number[]): number | null => {
    let closestIndex: number | null = null;
    let closestDistance = Infinity;

    embeddings.forEach((embedding, index) => {
      if (index !== currentTrackIndex) {
        const distance = calculateDistance(currentEmbedding, embedding);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });

    return closestIndex;
  };

  const playTrack = async (track: SpotifyApi.TrackObjectFull, index: number) => {
    setCurrentlyPlayingTrack(track);
    setCurrentTrackIndex(index);
    setPlayedTrackIndices((prev) => [...prev, index]);
    setPlaying(true);
    await spotify.play({ uris: [track.uri] });

    // Get the average color of the album cover and set it as the control bar color
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = track.album.images[0].url;
    img.onload = () => {
      const color = fac.getColor(img);
      setControlBarColor(color.hex);
    };

    // Queue the next closest track
    const currentEmbedding = embeddings[index];
    const nextClosestIndex = getNextClosestTrackIndex(currentEmbedding);
    if (nextClosestIndex !== null) {
      await spotify.queue(allTracks[nextClosestIndex].uri);
    }
  };

  const nextTrack = () => {
    if (currentTrackIndex !== null) {
      const currentEmbedding = embeddings[currentTrackIndex];
      const nextClosestIndex = getNextClosestTrackIndex(currentEmbedding);

      if (nextClosestIndex !== null) {
        const track = allTracks[nextClosestIndex];
        playTrack(track, nextClosestIndex);
      }
    }
  };

  const previousTrack = () => {
    if (playedTrackIndices.length > 1) {
      const previousIndex = playedTrackIndices[playedTrackIndices.length - 2];
      const track = allTracks[previousIndex];
      setPlayedTrackIndices((prev) => prev.slice(0, -1)); // Remove the last entry
      playTrack(track, previousIndex);
    }
  };

  const pauseTrack = () => {
    spotify.pause().then(() => console.log("Paused track"));
    setPlaying(false);
  };

  const resumeTrack = () => {
    spotify.play().then(() => console.log("Playing track"));
    setPlaying(true);
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

    UMAPFITTING(normalised, allTracks);
  };

  useEffect(() => {
    launchApp();
  }, []);

  return (
    <div className="w-screen h-screen flex justify-center items-center" ref={bodyRef}>
      {loading && (
        <div className="fixed  w-1/3 flex flex-col items-center">
          <p className="text-center mb-6 text-base leading-7">
            Quick sumn I spun up at the start of summer 2024, rn it&apos;s 24/06/2024. Monday morning. Today I gotta run, do some muscle ups and go salsa class. There&apos;s a life to live uno. Got
            bored of this project so stopped here, still pretty wavy so check it out. When your hearts not in it, stop. Go where the love is and do what excites, always maintain reps tho. HFWI.
          </p>
          <span className="loading loading-spinner loading-md mb-6 "></span>
          <p>Might take a second, if you have a lot of tracks in your library, be patient.</p>
        </div>
      )}
      {!loading && (
        <>
          <div className="w-min h-48 flex rounded-md fixed left-10 bottom-10 p-4" style={{ backgroundColor: controlBarColor }}>
            {currentlyPlayingTrack ? (
              <>
                <div className="w-48 h-40 rounded-md overflow-hidden relative">
                  <Image1
                    src={currentlyPlayingTrack?.album.images[0].url}
                    fill={true}
                    alt={currentlyPlayingTrack?.name}
                    objectFit="cover"
                    onClick={() => window.open(currentlyPlayingTrack?.uri, "_blank")}
                  />
                  <Image1 src={spotifyLogo} alt="Spotify Logo" width={100} height={20} className="absolute bottom-0 left-0" />
                </div>
                <div className="w-36 flex flex-col ml-4">
                  <div className="text-white">{currentlyPlayingTrack?.name}</div>
                  <div className="text-white text-opacity-65 truncate">{currentlyPlayingTrack?.artists.map((artist) => artist.name).join(", ")}</div>
                  <div className="flex items-center mt-4">
                    <FastRewindRoundedIcon onClick={previousTrack} className="text-white cursor-pointer text-xl" />
                    {playing ? (
                      <PauseRoundedIcon onClick={pauseTrack} className="text-white cursor-pointer text-3xl mx-2" />
                    ) : (
                      <PlayArrowRoundedIcon onClick={resumeTrack} className="text-white cursor-pointer text-3xl mx-2" />
                    )}
                    <FastForwardRoundedIcon onClick={nextTrack} className="text-white cursor-pointer text-xl" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-96 text-white">
                <p className="mb-4">Make sure Spotify is open on a device, then click a track to start radio sesh</p>
                <p>
                  Queing works first time, but since Spotify doesn&apos;t allow for queues to be cleared, you&apos;ll have to manually clear the queue once you click another track. Unless you want to
                  keep clicking next track. LONG.
                </p>
              </div>
            )}
          </div>
          <div className="absolute top-5 right-5">
            <p
              className=" text-white font-normal cursor-pointer"
              onClick={() => {
                const spotifyLogoutWindow = window.open(url, "Spotify Logout", "width=700,height=500,top=40,left=40");
                setTimeout(() => spotifyLogoutWindow!.close(), 1000);
                router.push("/");
              }}
            >
              Logout Project 30
            </p>
          </div>
        </>
      )}
    </div>
  );
}
