"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Station, Stations } from "./MRT Stations";

type Coordinates = { lat: number; long: number };

const mapBounds = Stations.reduce(
  (bounds, station) => {
    return {
      minLat: Math.min(bounds.minLat, station.lat),
      maxLat: Math.max(bounds.maxLat, station.lat),
      minLong: Math.min(bounds.minLong, station.long),
      maxLong: Math.max(bounds.maxLong, station.long),
    };
  },
  {
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
    minLong: Number.POSITIVE_INFINITY,
    maxLong: Number.NEGATIVE_INFINITY,
  }
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeToMap({ lat, long }: Coordinates) {
  const latRange = mapBounds.maxLat - mapBounds.minLat;
  const longRange = mapBounds.maxLong - mapBounds.minLong;

  if (latRange === 0 || longRange === 0) {
    return { x: 50, y: 50 };
  }

  const xPercent = ((long - mapBounds.minLong) / longRange) * 100;
  const yPercent = ((mapBounds.maxLat - lat) / latRange) * 100;

  return {
    x: clamp(xPercent, 0, 100),
    y: clamp(yPercent, 0, 100),
  };
}

function findClosestStation(coordinates: Coordinates) {
  const closest: { distance: number; station: Station | null } = {
    distance: Number.POSITIVE_INFINITY,
    station: null,
  };

  Stations.forEach((station) => {
    const R = 6371; // Radius of the Earth in kilometers
    const rlat1 = coordinates.lat * (Math.PI / 180);
    const rlat2 = station.lat * (Math.PI / 180);
    const difflat = rlat2 - rlat1;
    const difflon = (station.long - coordinates.long) * (Math.PI / 180);

    const distance =
      2 *
      R *
      Math.asin(
        Math.sqrt(
          Math.sin(difflat / 2) * Math.sin(difflat / 2) +
            Math.cos(rlat1) *
              Math.cos(rlat2) *
              Math.sin(difflon / 2) *
              Math.sin(difflon / 2)
        )
      );

    if (distance < closest.distance) {
      closest.distance = distance;
      closest.station = station;
    }
  });

  return closest.station;
}

export default function Home() {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [closestStation, setClosestStation] = useState<Station | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not available in this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (coords) => {
        const lat = coords.coords.latitude;
        const long = coords.coords.longitude;
        const location = { lat, long };

        setPosition(location);
        setClosestStation(findClosestStation(location));
        setError(null);
      },
      (geoError) => {
        setError(geoError.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 10_000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const markerPosition = useMemo(() => {
    if (!position) return null;
    return normalizeToMap(position);
  }, [position]);

  const closestStationMarker = useMemo(() => {
    if (!closestStation) return null;
    return normalizeToMap({ lat: closestStation.lat, long: closestStation.long });
  }, [closestStation]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">MRT Tracker</h1>
          <p className="text-base text-neutral-600 dark:text-neutral-300">
            Live view of your location relative to the Singapore MRT &amp; LRT map.
          </p>
        </header>

        <section className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
            <Image
              src="/Singapore_MRT_and_LRT_System_Map.svg"
              alt="Singapore MRT and LRT system map"
              fill
              priority
              className="object-contain"
            />

            <div className="pointer-events-none absolute inset-0">
              {markerPosition && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.25)]"
                  style={{
                    left: `${markerPosition.x}%`,
                    top: `${markerPosition.y}%`,
                    width: "16px",
                    height: "16px",
                  }}
                  aria-label="Your location"
                />
              )}

              {closestStationMarker && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-500 bg-white shadow-[0_0_0_4px_rgba(99,102,241,0.2)] dark:bg-neutral-900"
                  style={{
                    left: `${closestStationMarker.x}%`,
                    top: `${closestStationMarker.y}%`,
                    width: "16px",
                    height: "16px",
                  }}
                  aria-label="Closest station"
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
              <span>Your location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-indigo-500 bg-white dark:bg-neutral-900" />
              <span>Closest MRT station</span>
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold">Location details</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid gap-2 text-sm text-neutral-700 dark:text-neutral-200">
            <p className="font-medium">Status</p>
            <p>
              {position
                ? "Tracking your live position."
                : "Waiting for location permissions or GPS lock..."}
            </p>

            {position && (
              <p>
                Current coordinates: {position.lat.toFixed(5)}, {position.long.toFixed(5)}
              </p>
            )}

            {closestStation && (
              <p>
                Closest station: {closestStation.name} ({closestStation.id})
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
