import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Butlermock</title>
        <meta
          name="description"
          content="Interface to JSON: Easily create mocked data using your TypeScript interfaces and types, typescript to json online."
        />
        <meta
          name="keywords"
          content="Typescript to json online, typescript to JSON schema, mock data, TypeScript, JSON schema from interfaces, development with mock data, testing with mock data, interfaces to mock data, types to mock data, using Fakerjs for typescript interfaces"
        />
        <meta name="author" content="Devrafx" />

        <meta
          property="og:title"
          content="Interface to JSON: Create mock data from typescript interfaces"
        />
        <meta
          property="og:description"
          content="Interface to JSON: Easily create mocked data using your TypeScript interfaces and types"
        />
        <meta
          property="og:image"
          content="https://butlermock.online/bartender.png"
        />
        <meta property="og:url" content="https://butlermock.online/" />
        <meta property="og:type" content="website" />
        <meta
          name="google-site-verification"
          content="TYIkyMqVikn-0A3PmmOXETZMcDaNiRH_uw9GAIBM1BI"
        />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="stylesheet" type="text/css" href="/fonts/poppins.css" />

        <script async data-id="101422815" src="//static.getclicky.com/js">
        </script>
        <script
          data-name="BMC-Widget"
          data-cfasync="false"
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          data-id="devrafx"
          data-description="Support me on Buy me a coffee!"
          data-color="#888888"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
        >
        </script>
      </head>
      <body class="bg-monaco-950 min-h-[100dvh]">
        <Component />
      </body>
    </html>
  );
});
