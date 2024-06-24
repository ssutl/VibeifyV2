import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Login() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const scope = process.env.NEXT_PUBLIC_SPOTIFY_SCOPE;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT;

  const login_url = `https://accounts.spotify.com/authorize?&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">PROJECT 30</h1>
      <div className="max-w-prose px-4">
        <p className="text-center mb-4 text-base md:text-base">
          It maps the audio features of your Spotify playlists into a 3D space, allowing you to visualize which are similar and different. You can jump through them and skip to the most similar one.
          The goal was to basically create a radio station, which just plays the next most similar song in your playlists, but it got long and the sun&apos;s out so tengo que ir a disfrutar.
        </p>
        <p className="text-center mb-4 hidden text-sm md:text-base md:block">Always HFWI and when you stop having fun with it stop.</p>
      </div>
      <div className="bg-green-500 text-white font-bold py-2 px-4 rounded-full cursor-pointer mb-4" onClick={() => (window.location.href = login_url)}>
        Log In With Spotify
      </div>
      <h1 className="text-xl md:text-2xl font-bold mb-4 text-center">Privacy Policy</h1>
      <div className="max-w-prose px-4">
        <p className="text-center text-xs md:text-sm">
          By choosing to use this app, you agree to the use of your Spotify account username and data in order to analyse each of your saved playlists. None of the data used by Vibeify is stored or
          collected anywhere, and it is NOT shared with any third parties. All information is used solely for creating tailored playlists. You can rest assured that your data is not being stored or
          used maliciously, however, if you would like to revoke PROJECT 30 permissions, you can visit your apps page and click &quot;REMOVE ACCESS&quot; on Vibeify.{" "}
          <a target="_blank" href="https://support.spotify.com/us/article/spotify-on-other-apps/" className="text-green-400 underline">
            Here
          </a>{" "}
          is a more detailed guide for doing so.
        </p>
      </div>
    </div>
  );
}
