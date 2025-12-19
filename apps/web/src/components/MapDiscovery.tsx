"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl";
import clsx from "clsx";
import { fakeGeocode } from "@/lib/fakeGeocode";
import { fetchDiscoverableTeachers, fetchTeacherDetail, type TeacherDetail, type TeacherListItem } from "@/lib/api";
import { TeacherModal } from "@/components/TeacherModal";
import { addSchoolFavourite, fetchDiscoverableTeachersV2, fetchSchoolFavourites, removeSchoolFavourite } from "@/lib/api_v2";

type HoverCard =
  | {
      x: number;
      y: number;
      name: string;
      teachingLevel: string;
      profilePictureUrl: string;
      boosted: boolean;
      postcode: string;
      radiusKm: number;
    }
  | null;

function toFeature(t: TeacherListItem) {
  const coords =
    t.location.latitude !== null && t.location.longitude !== null
      ? { latitude: t.location.latitude, longitude: t.location.longitude }
      : fakeGeocode(t.location.postcode, t.teacherUserId);

  return {
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [coords.longitude, coords.latitude] as [number, number] },
    properties: {
      teacherUserId: t.teacherUserId,
      name: t.name,
      profile_picture_url: t.profile_picture_url,
      teaching_level: t.teaching_level,
      postcode: t.location.postcode,
      radius_km: t.location.radius_km
    }
  };
}

function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function MapDiscovery({
  postcode,
  center,
  maxDistanceKm
}: {
  postcode: string | null;
  center: { latitude: number; longitude: number } | null;
  maxDistanceKm: number | null;
}) {
  const mapRef = useRef<MapRef | null>(null);

  const [teachers, setTeachers] = useState<TeacherListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [view, setView] = useState({
    // Australia-first (SaaS demo expectation). No business logic change; only initial viewport.
    latitude: center?.latitude ?? -25.2744,
    longitude: center?.longitude ?? 133.7751,
    zoom: center ? 9 : 3.6,
    bearing: 0,
    pitch: 0
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hover, setHover] = useState<HoverCard>(null);
  const [boostedSet, setBoostedSet] = useState<Set<string>>(() => new Set());
  const [favouriteSet, setFavouriteSet] = useState<Set<string>>(() => new Set());
  const [favouriteBusy, setFavouriteBusy] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!center) return;
    setView((v) => ({ ...v, latitude: center.latitude, longitude: center.longitude, zoom: 9 }));
  }, [center?.latitude, center?.longitude]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchDiscoverableTeachers()
      .then((t) => {
        if (cancelled) return;
        setTeachers(t);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Failed to load teachers");
        setTeachers(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Phase 2 overlay: fetch boost flags (does NOT alter Phase 1 list source of truth).
  useEffect(() => {
    let cancelled = false;
    fetchDiscoverableTeachersV2()
      .then((rows) => {
        if (cancelled) return;
        const s = new Set<string>();
        for (const r of rows) if (r.is_boosted) s.add(r.teacherUserId);
        setBoostedSet(s);
      })
      .catch(() => {
        if (cancelled) return;
        setBoostedSet(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Phase 2 overlay: favourites (used for Save/Unsave UI). If token missing, this silently no-ops.
  useEffect(() => {
    let cancelled = false;
    fetchSchoolFavourites()
      .then((rows) => {
        if (cancelled) return;
        setFavouriteSet(new Set(rows.map((r) => r.teacherUserId)));
      })
      .catch(() => {
        if (cancelled) return;
        setFavouriteSet(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) return;
    let cancelled = false;
    setSelectedTeacher(null);
    fetchTeacherDetail(selectedTeacherId)
      .then((d) => {
        if (cancelled) return;
        setSelectedTeacher(d);
      })
      .catch(() => {
        if (cancelled) return;
        setSelectedTeacher(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTeacherId]);

  const geojson = useMemo(() => {
    const features = (teachers ?? []).map(toFeature);
    return { type: "FeatureCollection" as const, features };
  }, [teachers]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // UX target:
  // - Low zoom: heatmap + clusters (overview)
  // - High zoom: clusters dissolve into clickable avatar markers (detail)
  const ZOOM_SWITCH = 11;
  const showAvatars = view.zoom >= ZOOM_SWITCH;

  const filteredTeachers = useMemo(() => {
    const list = teachers ?? [];
    if (!postcode || !maxDistanceKm) return list;
    const origin = fakeGeocode(postcode, "origin");
    return list.filter((t) => {
      const coords =
        t.location.latitude !== null && t.location.longitude !== null
          ? { latitude: t.location.latitude, longitude: t.location.longitude }
          : fakeGeocode(t.location.postcode, t.teacherUserId);
      return haversineKm(origin, coords) <= maxDistanceKm;
    });
  }, [teachers, postcode, maxDistanceKm]);

  // Phase 2 sorting rule (frontend-only):
  // - Boosted teachers appear first
  // - Non-boosted preserve original Phase 1 order
  const orderedTeachers = useMemo(() => {
    if (filteredTeachers.length === 0) return filteredTeachers;
    if (boostedSet.size === 0) return filteredTeachers;
    const boosted: TeacherListItem[] = [];
    const regular: TeacherListItem[] = [];
    for (const t of filteredTeachers) {
      (boostedSet.has(t.teacherUserId) ? boosted : regular).push(t);
    }
    return [...boosted, ...regular];
  }, [filteredTeachers, boostedSet]);

  const avatarTeachers = useMemo(() => {
    if (!orderedTeachers) return [];
    if (!showAvatars) return [];
    const map = mapRef.current;
    if (!map) return orderedTeachers;
    const b = map.getBounds();
    if (!b) return filteredTeachers;
    return orderedTeachers.filter((t) => {
      const coords =
        t.location.latitude !== null && t.location.longitude !== null
          ? { latitude: t.location.latitude, longitude: t.location.longitude }
          : fakeGeocode(t.location.postcode, t.teacherUserId);
      return (
        coords.longitude >= b.getWest() &&
        coords.longitude <= b.getEast() &&
        coords.latitude >= b.getSouth() &&
        coords.latitude <= b.getNorth()
      );
    });
  }, [orderedTeachers, filteredTeachers, showAvatars, view.latitude, view.longitude, view.zoom]);

  if (!token) {
    return (
      <div className="rounded-3xl border border-white/10 bg-ink-900 p-6 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
        <div className="text-base font-semibold">Mapbox token required</div>
        <div className="mt-2 text-sm text-white/70">
          Set <span className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</span> in your web app environment.
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.9)]">
      <div className="absolute left-4 top-4 z-10 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80 shadow-sm backdrop-blur">
        {loading
          ? "Loading teachers…"
          : loadError
            ? `Error: ${loadError}`
            : `${filteredTeachers.length} teachers`}
        {postcode ? <span className="ml-2 text-white/60">Postcode: {postcode}</span> : null}
      </div>

      {toast ? (
        <div className="absolute right-4 top-4 z-10 rounded-2xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/90 shadow-sm backdrop-blur">
          {toast}
        </div>
      ) : null}

      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        initialViewState={view}
        latitude={view.latitude}
        longitude={view.longitude}
        zoom={view.zoom}
        bearing={view.bearing}
        pitch={view.pitch}
        onMove={(evt) => {
          const vs = evt.viewState;
          setView({ latitude: vs.latitude, longitude: vs.longitude, zoom: vs.zoom, bearing: vs.bearing, pitch: vs.pitch });
        }}
        style={{ width: "100%", height: 560 }}
        onMouseLeave={() => setHover(null)}
        onClick={(evt) => {
          const map = mapRef.current?.getMap();
          if (!map) return;
          // Click cluster -> zoom into it
          const features = map.queryRenderedFeatures(evt.point, { layers: ["clusters"] });
          const f = features?.[0];
          const clusterId = f?.properties?.cluster_id;
          if (clusterId === undefined || clusterId === null) return;
          const src: any = map.getSource("teachers");
          src.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            const coords = (f.geometry as any).coordinates as [number, number];
            map.easeTo({ center: coords, zoom, duration: 450 });
          });
        }}
      >
        <Source
          id="teachers"
          type="geojson"
          data={{ type: "FeatureCollection" as const, features: filteredTeachers.map(toFeature) }}
          cluster
          clusterRadius={50}
          // Keep clustering available into higher zooms (we only *render* it at high zoom).
          clusterMaxZoom={22}
        >
          <Layer
            id="teachers-heat"
            type="heatmap"
            maxzoom={ZOOM_SWITCH}
            paint={{
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.6, 9, 1.2],
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 10, 9, 40],
              "heatmap-opacity": 0.65
            }}
          />
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            maxzoom={ZOOM_SWITCH}
            paint={{
              "circle-color": ["step", ["get", "point_count"], "#60a5fa", 15, "#34d399", 50, "#f59e0b"],
              "circle-radius": ["step", ["get", "point_count"], 18, 15, 24, 50, 30],
              "circle-opacity": 0.85
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            maxzoom={ZOOM_SWITCH}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-size": 12
            }}
            paint={{ "text-color": "#0B1220" }}
          />
        </Source>

        {/* Avatar markers (dissolved clusters) */}
        {showAvatars
          ? avatarTeachers.map((t) => {
              const coords =
                t.location.latitude !== null && t.location.longitude !== null
                  ? { latitude: t.location.latitude, longitude: t.location.longitude }
                  : fakeGeocode(t.location.postcode, t.teacherUserId);

              const isBoosted = boostedSet.has(t.teacherUserId);

              return (
                <Marker
                  key={t.teacherUserId}
                  latitude={coords.latitude}
                  longitude={coords.longitude}
                  anchor="bottom"
                >
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className={clsx(
                        "group relative grid h-12 w-12 place-items-center overflow-hidden rounded-full border transition",
                        "shadow-[0_14px_32px_-18px_rgba(0,0,0,0.9)]",
                        isBoosted
                          ? "border-amber-300/70 shadow-[0_0_0_3px_rgba(251,191,36,0.10),0_14px_32px_-18px_rgba(0,0,0,0.9)]"
                          : "border-white/20",
                        "bg-white/10 hover:border-white/50 hover:bg-white/15 hover:-translate-y-0.5"
                      )}
                      onClick={() => {
                        setSelectedTeacherId(t.teacherUserId);
                        setModalOpen(true);
                      }}
                      onMouseEnter={(e) => {
                        const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setHover({
                          x: r.left + r.width / 2,
                          y: r.top,
                          name: t.name,
                        teachingLevel: t.teaching_level,
                        profilePictureUrl: t.profile_picture_url,
                        boosted: isBoosted,
                        postcode: t.location.postcode,
                        radiusKm: t.location.radius_km
                        });
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.profile_picture_url} alt={t.name} className="h-full w-full object-cover" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={favouriteBusy.has(t.teacherUserId)}
                        className={clsx(
                          "rounded-xl px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur transition",
                          favouriteSet.has(t.teacherUserId)
                            ? "bg-amber-300/90 text-ink-950 hover:bg-amber-300"
                            : "bg-white/10 hover:bg-white/15",
                          favouriteBusy.has(t.teacherUserId) ? "opacity-60" : ""
                        )}
                        onClick={async () => {
                          const id = t.teacherUserId;
                          const next = new Set(favouriteBusy);
                          next.add(id);
                          setFavouriteBusy(next);
                          try {
                            if (favouriteSet.has(id)) {
                              setFavouriteSet((s) => {
                                const n = new Set(s);
                                n.delete(id);
                                return n;
                              });
                              await removeSchoolFavourite(id);
                              setToast("Removed from favourites");
                            } else {
                              setFavouriteSet((s) => new Set(s).add(id));
                              await addSchoolFavourite(id);
                              setToast("Saved to favourites");
                            }
                          } catch (e) {
                            // revert (best effort)
                            setFavouriteSet((s) => new Set(s));
                            setToast(e instanceof Error ? e.message : "Action failed");
                          } finally {
                            setFavouriteBusy((s) => {
                              const n = new Set(s);
                              n.delete(id);
                              return n;
                            });
                            window.setTimeout(() => setToast(null), 1800);
                          }
                        }}
                      >
                        {favouriteSet.has(t.teacherUserId) ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                </Marker>
              );
            })
          : null}
      </Map>

      {hover ? (
        <div
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-3 rounded-3xl border border-white/10 bg-black/70 p-3 text-xs shadow-[0_18px_60px_-40px_rgba(0,0,0,0.95)] backdrop-blur"
          style={{ left: hover.x, top: hover.y }}
        >
          <div className="flex items-center gap-3">
            <div className={clsx("h-10 w-10 overflow-hidden rounded-2xl border bg-white/10", hover.boosted ? "border-amber-300/50" : "border-white/10")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hover.profilePictureUrl} alt={hover.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight">
                {hover.name}
                {hover.boosted ? (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-300/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                    Boost
                  </span>
                ) : null}
              </div>
              <div className="truncate text-xs text-white/70">{hover.teachingLevel}</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-white/60">
                <span className="font-mono">{hover.postcode}</span>
                <span>•</span>
                <span className="tabular-nums">{hover.radiusKm}km</span>
                <span>radius</span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-white/55">Click avatar to view profile</div>
        </div>
      ) : null}

      <TeacherModal
        open={modalOpen}
        teacher={selectedTeacher}
        onClose={() => {
          setModalOpen(false);
          setSelectedTeacherId(null);
          setSelectedTeacher(null);
        }}
      />
    </div>
  );
}


