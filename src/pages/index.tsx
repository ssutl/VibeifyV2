import Image from "next/image";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Login() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const scope = process.env.NEXT_PUBLIC_SPOTIFY_SCOPE;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT;

  const login_url = `https://accounts.spotify.com/authorize?&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;

  return (
    <main className={`flex h-full w-full`}>
      <div className="btn" onClick={() => (window.location.href = login_url)}>
        Hello World
      </div>
    </main>
  );
}
