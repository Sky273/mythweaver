"use client";

import { useEffect, useState } from "react";

// Shows the preview image inline; clicking it opens a full-screen lightbox
// that toggles between "fit to screen" and the image's real (original) size,
// which the user can then pan/scroll to inspect at 1:1.
export function ImageLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [actualSize, setActualSize] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);

    // Lock background scroll while the lightbox is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    setActualSize(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agrandir l'image en plein écran"
        className="mt-6 block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-primary"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Image en plein écran"}
          onClick={close}
          className={`fixed inset-0 z-[60] flex bg-black/90 backdrop-blur-sm ${
            actualSize ? "overflow-auto" : "items-center justify-center p-4"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(event) => {
              event.stopPropagation();
              setActualSize((value) => !value);
            }}
            className={
              actualSize
                ? "m-auto max-w-none cursor-zoom-out"
                : "max-h-[100dvh] max-w-full cursor-zoom-in object-contain"
            }
          />

          <div
            className="fixed right-4 top-4 flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActualSize((value) => !value)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
            >
              {actualSize ? "Ajuster à l'écran" : "Taille réelle"}
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
