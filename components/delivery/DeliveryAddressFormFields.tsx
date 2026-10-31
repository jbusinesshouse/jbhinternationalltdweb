"use client";

import { DISTRICTS, getUpazilasForDistrict } from "@/lib/bdLocations";
import { useMemo } from "react";

export type AddressFormValues = {
  label: string;
  district: string;
  upazila: string;
  address: string;
};

export const emptyAddressForm = (): AddressFormValues => ({
  label: "",
  district: "",
  upazila: "",
  address: "",
});

const fieldClass =
  "w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted";

type Props = {
  values: AddressFormValues;
  onChange: (next: AddressFormValues) => void;
  showLabel?: boolean;
};

export function DeliveryAddressFormFields({
  values,
  onChange,
  showLabel = true,
}: Props) {
  const upazilas = useMemo(
    () => getUpazilasForDistrict(values.district),
    [values.district]
  );

  const set = (key: keyof AddressFormValues, value: string) => {
    if (key === "district") {
      onChange({ ...values, district: value, upazila: "" });
      return;
    }
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="flex flex-col gap-3">
      {showLabel && (
        <input
          type="text"
          placeholder="নাম (ঐচ্ছিক) যেমন: বাসা, গুদাম"
          value={values.label}
          onChange={(e) => set("label", e.target.value)}
          className={fieldClass}
        />
      )}

      <select
        value={values.district}
        onChange={(e) => set("district", e.target.value)}
        className={fieldClass}
        required
      >
        <option value="">জেলা বাছাই করুন *</option>
        {DISTRICTS.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        value={values.upazila}
        onChange={(e) => set("upazila", e.target.value)}
        disabled={!values.district}
        className={fieldClass}
      >
        <option value="">উপজেলা / থানা বাছাই করুন</option>
        {upazilas.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      <textarea
        placeholder="রাস্তা / বিস্তারিত ঠিকানা *"
        value={values.address}
        onChange={(e) => set("address", e.target.value)}
        rows={3}
        className={`${fieldClass} resize-y min-h-[80px]`}
        required
      />

      {!values.district && (
        <p className="text-xs text-muted">জেলা বাছাই করা বাধ্যতামূলক।</p>
      )}
    </div>
  );
}
