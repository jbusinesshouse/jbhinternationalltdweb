"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DeliveryAddressFormFields,
  AddressFormValues,
  emptyAddressForm,
} from "@/components/delivery/DeliveryAddressFormFields";
import {
  createDeliveryAddress,
  deleteDeliveryAddress,
  DeliveryAddress,
  formatDeliveryAddressLine,
  listDeliveryAddresses,
  setDefaultDeliveryAddress,
} from "@/lib/deliveryAddresses";

type ProfileLite = {
  id: string;
  district?: string | null;
  upazila?: string | null;
  address?: string | null;
  default_delivery_address_id?: string | null;
};

type Props = {
  profile: ProfileLite;
  onProfileDefaultChange?: (addressId: string | null) => void;
};

export function DeliveryAddressSection({
  profile,
  onProfileDefaultChange,
}: Props) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressFormValues>(emptyAddressForm());
  const [defaultId, setDefaultId] = useState<string | null>(
    profile.default_delivery_address_id ?? null
  );
  const [deleteTarget, setDeleteTarget] = useState<DeliveryAddress | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listDeliveryAddresses(profile.id);
      setAddresses(rows);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setDefaultId(profile.default_delivery_address_id ?? null);
  }, [profile.default_delivery_address_id]);

  const storeLine = formatDeliveryAddressLine({
    district: profile.district,
    upazila: profile.upazila,
    address: profile.address,
  });

  const handleSetDefaultStore = async () => {
    setSaving(true);
    try {
      await setDefaultDeliveryAddress(profile.id, null);
      setDefaultId(null);
      onProfileDefaultChange?.(null);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultSaved = async (id: string) => {
    setSaving(true);
    try {
      await setDefaultDeliveryAddress(profile.id, id);
      setDefaultId(id);
      onProfileDefaultChange?.(id);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!form.district.trim() || !form.address.trim()) {
      setFormError("District and address are required.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const created = await createDeliveryAddress(profile.id, form);
      setAddresses((prev) => [created, ...prev]);
      setForm(emptyAddressForm());
      setShowForm(false);
    } catch (e: unknown) {
      setFormError(
        e instanceof Error ? e.message : "Could not save address."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteDeliveryAddress(deleteTarget.id, profile.id);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (defaultId === deleteTarget.id) {
        setDefaultId(null);
        onProfileDefaultChange?.(null);
      }
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyAddressForm());
    setFormError(null);
  };

  return (
    <div>
      <p className="mt-1 text-sm text-muted">
        Choose where orders should be delivered. Your store address stays for
        your business profile.
      </p>

      {/* Store address card */}
      <div
        className={`mt-4 rounded-xl border p-4 transition-colors ${
          defaultId == null
            ? "border-primary bg-primary/5"
            : "border-border bg-surface/50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground">Store address</p>
          {defaultId == null && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
              Default
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {storeLine || "No store address set"}
        </p>
        {defaultId != null && (
          <button
            type="button"
            onClick={handleSetDefaultStore}
            disabled={saving}
            className="mt-3 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
          >
            Set as default delivery
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : (
        addresses.map((addr) => {
          const isDefault = defaultId === addr.id;
          return (
            <div
              key={addr.id}
              className={`mt-3 rounded-xl border p-4 transition-colors ${
                isDefault
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">
                  {addr.label?.trim() || "Saved address"}
                </p>
                {isDefault && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {formatDeliveryAddressLine(addr)}
              </p>
              <div className="mt-3 flex items-center justify-between">
                {!isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefaultSaved(addr.id)}
                    disabled={saving}
                    className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    Set as default
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(addr)}
                  disabled={saving}
                  className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm ? (
        <div className="mt-4 rounded-xl border border-border bg-white p-4">
          <p className="font-semibold text-foreground">New delivery address</p>
          <div className="mt-3">
            <DeliveryAddressFormFields values={form} onChange={setForm} />
          </div>
          {formError && (
            <p className="mt-2 text-sm text-red-600">{formError}</p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="flex-1 rounded-lg bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save address"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 w-full rounded-xl border border-dashed border-primary bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          + Add delivery address
        </button>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this address?"
        description="This saved delivery address will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => !saving && setDeleteTarget(null)}
      />
    </div>
  );
}
