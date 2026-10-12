import { HttpError } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function ErrorPage(props) {
  const error = props.error;
  const notFound = error instanceof HttpError && error.status === 404;
  const title = notFound ? "404 - Page not found" : "Something went wrong";

  return (
    <div class="min-h-[100dvh] bg-white">
      <Head>
        <title>{title}</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-[#86efac]">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
            src="/logo.svg"
            width="128"
            height="128"
            alt="the fresh logo: a sliced lemon dripping with juice"
          />
          <h1 class="text-4xl font-bold">{title}</h1>
          <p class="my-4">
            {notFound
              ? "The page you were looking for doesn't exist."
              : "An unexpected error occurred. Please try again."}
          </p>
          <a href="/" class="underline">Go back home</a>
        </div>
      </div>
    </div>
  );
});
