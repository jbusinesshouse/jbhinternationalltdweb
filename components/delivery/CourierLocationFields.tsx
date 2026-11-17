"use client";

import { useEffect, useState } from "react";
import {
  CourierArea,
  CourierCity,
  CourierLocation,
  CourierZone,
  fetchCourierAreas,
  fetchCourierCities,
  fetchCourierZones,
} from "@/lib/courier";

const selectClass =
  "w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted";

/**
 * Pathao city → zone → area pickers.
 * `mode="delivery"` hides areas without home delivery; `mode="pickup"` hides areas without pickup.
 */
export function CourierLocationFields({
  value,
  onChange,
  mode = "delivery",
  requireArea = false,
}: {
  value: CourierLocation;
  onChange: (next: CourierLocation) => void;
  mode?: "delivery" | "pickup";
  requireArea?: boolean;
}) {
  const [cities, setCities] = useState<CourierCity[]>([]);
  // Lists are stored with the parent id they belong to, so a stale list never shows.
  const [zonesFor, setZonesFor] = useState<{ cityId: number; list: CourierZone[] } | null>(null);
  const [areasFor, setAreasFor] = useState<{ zoneId: number; list: CourierArea[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourierCities()
      .then(setCities)
      .catch(() => setError("শহরের তালিকা লোড করা যায়নি।"));
  }, []);

  useEffect(() => {
    const cityId = value.city_id;
    if (!cityId) return;
    let cancelled = false;
    fetchCourierZones(cityId)
      .then((list) => !cancelled && setZonesFor({ cityId, list }))
      .catch(() => !cancelled && setError("এলাকার তালিকা লোড করা যায়নি।"));
    return () => {
      cancelled = true;
    };
  }, [value.city_id]);

  useEffect(() => {
    const zoneId = value.zone_id;
    if (!zoneId) return;
    let cancelled = false;
    fetchCourierAreas(zoneId)
      .then((rows) => {
        if (cancelled) return;
        const list = rows.filter((a) => (mode === "pickup" ? a.pickup_available : a.home_delivery_available));
        setAreasFor({ zoneId, list });
      })
      .catch(() => !cancelled && setError("এরিয়ার তালিকা লোড করা যায়নি।"));
    return () => {
      cancelled = true;
    };
  }, [value.zone_id, mode]);

  const zones = zonesFor && zonesFor.cityId === value.city_id ? zonesFor.list : [];
  const areas = areasFor && areasFor.zoneId === value.zone_id ? areasFor.list : [];
  const num = (v: string) => (v ? Number(v) : null);

  return (
    <div className="flex flex-col gap-3">
      <select
        aria-label="শহর"
        className={selectClass}
        value={value.city_id ?? ""}
        onChange={(e) => onChange({ city_id: num(e.target.value), zone_id: null, area_id: null })}
      >
        <option value="">শহর বাছাই করুন *</option>
        {cities.map((c) => (
          <option key={c.city_id} value={c.city_id}>
            {c.city_name}
          </option>
        ))}
      </select>
      <select
        aria-label="জোন"
        className={selectClass}
        disabled={!value.city_id}
        value={value.zone_id ?? ""}
        onChange={(e) => onChange({ ...value, zone_id: num(e.target.value), area_id: null })}
      >
        <option value="">জোন / থানা বাছাই করুন *</option>
        {zones.map((z) => (
          <option key={z.zone_id} value={z.zone_id}>
            {z.zone_name}
          </option>
        ))}
      </select>
      <select
        aria-label="এরিয়া"
        className={selectClass}
        disabled={!value.zone_id}
        value={value.area_id ?? ""}
        onChange={(e) => onChange({ ...value, area_id: num(e.target.value) })}
      >
        <option value="">{requireArea ? "এরিয়া বাছাই করুন *" : "এরিয়া (ঐচ্ছিক)"}</option>
        {areas.map((a) => (
          <option key={a.area_id} value={a.area_id}>
            {a.area_name}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
    </div>
  );
}
