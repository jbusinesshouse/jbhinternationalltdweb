"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import {
  parsePositiveInt,
  parsePositiveNumber,
  removeProductStoragePaths,
  softDeleteProduct,
  uploadProductImageFile,
} from "@/lib/productMedia";
import { supabase } from "@/lib/supabase/browser";

type Variant = { color: string; sizes: { label: string; stock: string }[] };

export function ProductUploadForm({
  sellerId,
  productId,
}: {
  sellerId: string;
  productId?: string;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [variants, setVariants] = useState<Variant[]>([
    { color: "Default", sizes: [{ label: "Free", stock: "10" }] },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => setCategories(data ?? []));
    supabase.from("subcategories").select("*").order("name").then(({ data }) => setSubcategories(data ?? []));
    if (productId) {
      supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()
        .then(({ data }) => {
          if (data) {
            setName(data.name);
            setPrice(String(data.price));
            setMoq(String(data.moq));
            setDescription(data.description ?? "");
            setCategoryId(data.category_id ?? "");
            setSubcategoryId(data.subcategory_id ?? "");
          }
        });
    }
  }, [productId]);

  useEffect(() => {
    if (!categoryId) return;
    supabase
      .from("sizes")
      .select("*")
      .eq("category", categories.find((c) => c.id === categoryId)?.name ?? "")
      .then(({ data }) => setSizes(data ?? []));
  }, [categoryId, categories]);

  const filteredSubs = subcategories.filter(
    (s) => s.category_id === categoryId
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const priceNum = parsePositiveNumber(price);
    const moqNum = parsePositiveInt(moq);
    if (!name.trim() || !priceNum || !moqNum || !categoryId || !subcategoryId) {
      alert("Fill all required fields");
      return;
    }
    if (!productId && !mainImage) {
      alert("Main image is required");
      return;
    }

    setSubmitting(true);
    let createdId: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      if (productId) {
        const { error } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            price: String(priceNum),
            moq: moqNum,
            description,
            category_id: categoryId,
            subcategory_id: subcategoryId,
          })
          .eq("id", productId);
        if (error) throw error;
        alert("Product updated!");
        router.push("/account");
        return;
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          price: String(priceNum),
          moq: moqNum,
          description: description || `<p>${name}</p>`,
          seller_id: sellerId,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          status: "active",
          is_deleted: false,
        })
        .select("id")
        .single();

      if (productError || !product) throw productError;
      createdId = product.id;
      const folder = `products/${createdId}`;

      if (mainImage) {
        const uploaded = await uploadProductImageFile(mainImage, folder);
        uploadedPaths.push(uploaded.path);
        await supabase.from("product_images").insert({
          product_id: createdId,
          image_url: uploaded.publicUrl,
          is_main: true,
          sort_order: 0,
        });
      }

      for (const variant of variants) {
        const { data: vData, error: vErr } = await supabase
          .from("product_variants")
          .insert({ product_id: createdId, color: variant.color.trim() })
          .select("id")
          .single();
        if (vErr || !vData) throw vErr;
        const sizesData = variant.sizes.map((s) => ({
          variant_id: vData.id,
          size: s.label,
          stock: parsePositiveInt(s.stock) ?? 0,
        }));
        const { error: sErr } = await supabase
          .from("product_sizes")
          .insert(sizesData);
        if (sErr) throw sErr;
      }

      alert("Product uploaded successfully!");
      router.push("/account");
    } catch (err: any) {
      if (createdId) await softDeleteProduct(createdId);
      if (uploadedPaths.length) await removeProductStoragePaths(uploadedPaths);
      alert(err.message || "Upload failed");
    }
    setSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title={productId ? "Edit Product" : "Upload Product"}
        description="Add a new product to your store"
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!productId && (
            <div>
              <label className="text-sm font-medium">Main Image *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMainImage(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm"
              />
            </div>
          )}
          <input
            placeholder="Product name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              placeholder="Price (BDT) *"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="rounded-lg border border-border px-3 py-2"
              required
            />
            <input
              placeholder="MOQ *"
              value={moq}
              onChange={(e) => setMoq(e.target.value)}
              className="rounded-lg border border-border px-3 py-2"
              required
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId("");
            }}
            className="w-full rounded-lg border border-border px-3 py-2"
            required
          >
            <option value="">Select category *</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2"
            required
            disabled={!categoryId}
          >
            <option value="">Select subcategory *</option>
            {filteredSubs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Description (HTML supported)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          {!productId && (
            <div>
              <p className="text-sm font-medium">Variants</p>
              {variants.map((v, vi) => (
                <div key={vi} className="mt-2 rounded-lg border border-border p-3">
                  <input
                    placeholder="Color"
                    value={v.color}
                    onChange={(e) => {
                      const next = [...variants];
                      next[vi].color = e.target.value;
                      setVariants(next);
                    }}
                    className="mb-2 w-full rounded border px-2 py-1 text-sm"
                  />
                  {v.sizes.map((s, si) => (
                    <div key={si} className="flex gap-2">
                      <input
                        placeholder="Size"
                        value={s.label}
                        onChange={(e) => {
                          const next = [...variants];
                          next[vi].sizes[si].label = e.target.value;
                          setVariants(next);
                        }}
                        className="flex-1 rounded border px-2 py-1 text-sm"
                      />
                      <input
                        placeholder="Stock"
                        value={s.stock}
                        onChange={(e) => {
                          const next = [...variants];
                          next[vi].sizes[si].stock = e.target.value;
                          setVariants(next);
                        }}
                        className="w-24 rounded border px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving..." : productId ? "Update Product" : "Upload Product"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
