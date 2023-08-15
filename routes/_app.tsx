import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function App({ Component }: AppProps) {
  return (
    <>
      <Head>
        <link rel="stylesheet" type="text/css" href="/fonts/poppins.css" />
        <link rel="stylesheet" type="text/css" href="/global.css" />
      </Head>
      <Component />
    </>
  );
}
