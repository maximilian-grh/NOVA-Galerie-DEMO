import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { Logo } from "../components/Icons/Logo";
import Modal from "../components/Modal";
import cloudinary from "../utils/cloudinary";
import getBase64ImageUrl from "../utils/generateBlurPlaceholder";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import downloadPhoto from "../utils/downloadPhoto";

const Home: NextPage = ({ images }: { images: ImageProps[] }) => {
  const router = useRouter();
  const { photoId } = router.query;
  const [lastViewedPhoto, setLastViewedPhoto] = useLastViewedPhoto();

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef.current.scrollIntoView({ block: "center" });
      setLastViewedPhoto(null);
    }
  }, [photoId, lastViewedPhoto, setLastViewedPhoto]);

  // Funktion zum Herunterladen eines Ordners von Cloudinary
  const downloadFolder = () => {
    // URL des Cloudinary Ordners
    const folderUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/utilities/download_folder?path=${process.env.CLOUDINARY_FOLDER}`;

    // Erstellen des Links zum Herunterladen des Ordners
    const downloadLink = document.createElement("a");
    downloadLink.href = folderUrl;
    downloadLink.download = `${process.env.CLOUDINARY_FOLDER}.zip`;
    downloadLink.click();
  };

  return (
    <>
      <Head>
        <title>NOVA - Galerie DEMO</title>
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        {photoId && (
          <Modal
            images={images}
            onClose={() => {
              setLastViewedPhoto(photoId);
            }}
          />
        )}
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
          <div className="after:content relative mb-5 flex h-[629px] flex-col items-center justify-end gap-4 overflow-hidden rounded-2xl bg-[#031f29] px-6 pb-16 pt-64 text-center text-white">
            <div>
              <Logo className="h-2/3 w-full object-cover" />
            </div>

            <h1 className="mt-8 mb-4 text-lg font-bold tracking-widest">
              Clientname
            </h1>
            <p className="max-w-[40ch] text-white/75 sm:max-w-[32ch]">
              Dankeschön für die super coole Zusammenarbeit!
            </p>
            <button
              onClick={downloadFolder}
              className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white"
              title="Download fullsize version"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
            <a
              className="pointer z-10 mt-6 rounded-full border border-[#9EC1A3] bg-[#9EC1A3] px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10 hover:text-white md:mt-4"
              href="https://www.google.com/maps/place/wirsindnova.at+-+NOVA+Kreativagentur+OG/@48.2203445,16.09988,10z/data=!3m1!4b1!4m6!3m5!1s0x6503f3e7b720379b:0x4d7194203dbfb8ea!8m2!3d48.2206849!4d16.38006!16s%2Fg%2F11r_tqvjhj"
              target="_blank"
              rel="noreferrer"
            >
              Bewertung hinterlassen
            </a>
          </div>
          {images.map(({ id, public_id, format, blurDataUrl }) => (
            <Link
              key={id}
              href={`/?photoId=${id}`}
              as={`/p/${id}`}
              ref={id === Number(lastViewedPhoto) ? lastViewedPhotoRef : null}
              shallow
              className="after:content group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
            >
              <Image
                alt="Next.js Conf photo"
                className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
                style={{ transform: "translate3d(0, 0, 0)" }}
                placeholder="blur"
                blurDataURL={blurDataUrl}
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_720/${public_id}.${format}`}
                width={720}
                height={480}
                sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
              />
            </Link>
          ))}
        </div>
      </main>
      <footer className="p-6 text-center text-white/80 sm:p-12">
        Vielen lieben Dank für die Zusammenarbeit, gerne wieder!
      </footer>
    </>
  );
};

export default Home;

export async function getStaticProps() {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
    .sort_by("public_id", "desc")
    .max_results(400)
    .execute();
  let reducedResults: ImageProps[] = [];

  let i = 0;
  for (let result of results.resources) {
    reducedResults.push({
      id: i,
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      format: result.format,
    });
    i++;
  }

  const blurImagePromises = results.resources.map((image: ImageProps) => {
    return getBase64ImageUrl(image);
  });
  const imagesWithBlurDataUrls = await Promise.all(blurImagePromises);

  for (let i = 0; i < reducedResults.length; i++) {
    reducedResults[i].blurDataUrl = imagesWithBlurDataUrls[i];
  }

  return {
    props: {
      images: reducedResults,
    },
  };
}
