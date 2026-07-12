"use client";

import { useState } from "react";
import Link from "next/link";
import { addMapPin, deleteMapPin } from "./actions";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form-styles";

type Pin = {
  id: string;
  x: number;
  y: number;
  location: { id: string; name: string };
};
type LocationOption = { id: string; name: string };

export function MapPinEditor({
  campaignId,
  assetId,
  imageSrc,
  pins,
  locations,
}: {
  campaignId: string;
  assetId: string;
  imageSrc: string;
  pins: Pin[];
  locations: LocationOption[];
}) {
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);

  function handleImageClick(event: React.MouseEvent<HTMLImageElement>) {
    if (!adding) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPending({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    });
  }

  const markerClass =
    "absolute -translate-x-1/2 -translate-y-full text-2xl leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={secondaryButtonClass}
          >
            📍 Ajouter un point
          </button>
        ) : (
          <>
            <span className="text-sm text-muted">
              Clique sur la carte pour placer un point.
            </span>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setPending(null);
              }}
              className={secondaryButtonClass}
            >
              Terminer
            </button>
          </>
        )}
      </div>

      <div className="relative mt-4 inline-block max-w-full overflow-hidden rounded-lg border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Carte"
          onClick={handleImageClick}
          className={`block max-w-full ${adding ? "cursor-crosshair" : ""}`}
        />

        {pins.map((pin) => (
          <Link
            key={pin.id}
            href={`/campaigns/${campaignId}/locations/${pin.location.id}/edit`}
            title={pin.location.name}
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              pointerEvents: adding ? "none" : "auto",
            }}
            className={markerClass}
          >
            📍
          </Link>
        ))}

        {pending && (
          <span
            style={{ left: `${pending.x}%`, top: `${pending.y}%` }}
            className={`${markerClass} animate-pulse`}
          >
            📍
          </span>
        )}
      </div>

      {pending && (
        <form
          action={addMapPin}
          onSubmit={() => setPending(null)}
          className="card mt-4 max-w-md space-y-3 p-4"
        >
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="assetId" value={assetId} />
          <input type="hidden" name="x" value={pending.x} />
          <input type="hidden" name="y" value={pending.y} />

          <div>
            <label htmlFor="locationId" className={labelClass}>
              Lieu associé à ce point
            </label>
            <select
              id="locationId"
              name="locationId"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Choisir un lieu…
              </option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button type="submit" className={primaryButtonClass}>
              Placer le point
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className={secondaryButtonClass}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-muted">
          Points placés ({pins.length})
        </h2>
        {pins.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Aucun point pour l&apos;instant.
          </p>
        ) : (
          <ul className="card mt-2 divide-y divide-border">
            {pins.map((pin) => (
              <li
                key={pin.id}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <Link
                  href={`/campaigns/${campaignId}/locations/${pin.location.id}/edit`}
                  className="hover:underline"
                >
                  📍 {pin.location.name}
                </Link>
                <form action={deleteMapPin}>
                  <input type="hidden" name="campaignId" value={campaignId} />
                  <input type="hidden" name="assetId" value={assetId} />
                  <input type="hidden" name="pinId" value={pin.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Retirer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
