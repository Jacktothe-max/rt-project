"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl";
import clsx from "clsx";
import { fakeGeocode } from "@/lib/fakeGeocode";
import { TeacherModalV3 } from "@/components/v3/TeacherModalV3";
import { fetchDiscoverableTeachersV3, fetchTeacherDetailV3, type TeacherDetailV3, type TeacherListV3Item } from "@/lib/api_v3";

type HoverCard = { x: number; y: number; name: string; teachingLevel: string; boosted: boolean; priority: boolean } | null;

function toFeature(t: TeacherListV3Item) {
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
      is_boosted: t.is_boosted,
      is_priority: t.is_priority
    }
  };
}

export function MapDiscoveryV3({
  postcode,
  center,
  countryCode
}: {
  postcode: string | null;
  center: { latitude: number; longitude: number } | null;
  countryCode: string;
}) {
  const mapRef = useRef<MapRef | null>(null);
  const [teachers, setTeachers] = useState<TeacherListV3Item[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState({
    latitude: center?.latitude ?? 0,
    longitude: center?.longitude ?? 0,
    zoom: center ? 9 : 1.2,
    bearing: 0,
    pitch: 0
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherDetailV3 | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hover, setHover] = useState<HoverCard>(null);

  useEffect(() => {
    if (!center) return;
    setView((v) => ({ ...v, latitude: center.latitude, longitude: center.longitude, zoom: 9 }));
  }, [center?.latitude, center?.longitude]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDiscoverableTeachersV3({ country_code: countryCode })
      .then((rows) => {
        if (cancelled) return;
        setTeachers(rows);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setTeachers(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  useEffect(() => {
    if (!selectedTeacherId) return;
    let cancelled = false;
    setSelectedTeacher(null);
    fetchTeacherDetailV3({ teacherUserId: selectedTeacherId, country_code: countryCode })
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
  }, [selectedTeacherId, countryCode]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const ZOOM_SWITCH = 11;
  const showAvatars = view.zoom >= ZOOM_SWITCH;

  const geojson = useMemo(() => {
    return { type: "FeatureCollection" as const, features: (teachers ?? []).map(toFeature) };
  }, [teachers]);

  if (!token) {
    return (
      <div className="rounded-2xl border border-white/10 bg-ink-900 p-6">
        <div className="text-base font-semibold">Mapbox token required</div>
        <div className="mt-2 text-sm text-white/70">
          Set <span className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</span>.
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
      <div className="absolute left-4 top-4 z-10 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur">
        {loading ? "Loading teachers…" : error ? `Error: ${error}` : `${teachers?.length ?? 0} teachers`}
        <span className="ml-2 text-white/60">Country: {countryCode}</span>
        {postcode ? <span className="ml-2 text-white/60">Postcode: {postcode}</span> : null}
      </div>

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
        <Source id="teachers" type="geojson" data={geojson} cluster clusterRadius={50} clusterMaxZoom={22}>
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
            layout={{ "text-field": "{point_count_abbreviated}", "text-size": 12 }}
            paint={{ "text-color": "#0B1220" }}
          />
        </Source>

        {showAvatars
          ? (teachers ?? []).map((t) => {
              const coords =
                t.location.latitude !== null && t.location.longitude !== null
                  ? { latitude: t.location.latitude, longitude: t.location.longitude }
                  : fakeGeocode(t.location.postcode, t.teacherUserId);

              return (
                <Marker key={t.teacherUserId} latitude={coords.latitude} longitude={coords.longitude} anchor="bottom">
                  <button
                    className={clsx(
                      "group relative grid h-12 w-12 place-items-center overflow-hidden rounded-full border shadow-lg",
                      t.is_boosted ? "border-amber-300/70" : t.is_priority ? "border-fuchsia-300/60" : "border-white/20",
                      "bg-white/10 hover:border-white/50"
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
                        boosted: t.is_boosted,
                        priority: t.is_priority
                      });
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.profile_picture_url} alt={t.name} className="h-full w-full object-cover" />
                  </button>
                </Marker>
              );
            })
          : null}
      </Map>

      {hover ? (
        <div
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-3 rounded-xl border border-white/10 bg-black/70 px-3 py-2 text-xs backdrop-blur"
          style={{ left: hover.x, top: hover.y }}
        >
          <div className="font-semibold">
            {hover.name}
            {hover.boosted ? <span className="ml-2 text-xs text-amber-200">Boosted</span> : null}
            {!hover.boosted && hover.priority ? <span className="ml-2 text-xs text-fuchsia-200">Priority</span> : null}
          </div>
          <div className="text-white/70">{hover.teachingLevel}</div>
          <div className="text-white/50">Click for profile</div>
        </div>
      ) : null}

      <TeacherModalV3
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


