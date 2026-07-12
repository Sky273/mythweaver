"use client";

import { useState } from "react";
import Link from "next/link";
import { addMapPin, deleteMapPin, updateMapPinLabel } from "./actions";
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
  label: string | null;
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
    "absolute -translate-x-1/2 -translate-y-full flex flex-col items-center";

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
            {pin.label && (
              <span className="mb-0.5 max-w-[10rem] truncate rounded bg-black/70 px-1 py-0.5 text-[10px] font-medium leading-tight text-white">
                {pin.label}
              </span>
            )}
            <span className="text-2xl leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
              📍
            </span>
          </Link>
        ))}

        {pending && (
          <span
            style={{ left: `${pending.x}%`, top: `${pending.y}%` }}
            className={`${markerClass} animate-pulse`}
          >
            <span className="text-2xl leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
              📍
            </span>
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

          <div>
            <label htmlFor="label" className={labelClass}>
              Libellé (optionnel)
            </label>
            <input
              id="label"
              name="label"
              className={inputClass}
              placeholder="Ex. : Taverne du Cor brisé"
            />
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
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 text-sm"
              >
                <form
                  action={updateMapPinLabel}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="campaignId" value={campaignId} />
                  <input type="hidden" name="assetId" value={assetId} />
                  <input type="hidden" name="pinId" value={pin.id} />
                  <input
                    name="label"
                    defaultValue={pin.label ?? ""}
                    placeholder="Libellé…"
                    className="w-40 rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:ring-1 focus:ring-primary/30 focus-visible:outline-none"
                  />
                  <button
                    type="submit"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Enregistrer
                  </button>
                </form>

                <Link
                  href={`/campaigns/${campaignId}/locations/${pin.location.id}/edit`}
                  className="text-muted hover:text-primary hover:underline"
                >
                  📍 {pin.location.name}
                </Link>

                <form action={deleteMapPin} className="ml-auto">
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
