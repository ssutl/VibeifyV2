import type { AppProps } from "next/app";
import "../styles/globals.css";
import "react-notifications-component/dist/theme.css";
import { ReactNotifications } from "react-notifications-component";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ReactNotifications />
      <Component {...pageProps} />
    </>
  );
}
