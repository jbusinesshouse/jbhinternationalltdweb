"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, PageHeader } from "@/components/ui/PageElements";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
  parsePositiveInt,
  parsePositiveNumber,
  plainTextFromHtml,
  removeProductStoragePaths,
  softDeleteProduct,
  uploadProductImageFile,
} from "@/lib/productMedia";
import { supabase } from "@/lib/supabase/browser";
import type { UserProfile } from "@/lib/profile";

const MAX_ADDITIONAL_IMAGES = 8;

type SizeEntry = {
  size_id: string;
  label: string;
  stock: string;
};

type Variant = {
  color: string;
  sizes: SizeEntry[];
};

type DbSize = {
  id: string;
  label: string;
  category: string;
};

type Category = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  name: string;
  category_id: string;
};

type AdditionalImage = {
  file: File;
  preview: string;
};

const fieldClass =
  "w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function ProductUploadForm({
  sellerId,
  productId,
  profile,
}: {
  sellerId: string;
  productId?: string;
  profile?: Pick<UserProfile, "store_type" | "status"> | null;
}) {
  const router = useRouter();
  const sizesRequestIdRef = useRef(0);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [availableSizes, setAvailableSizes] = useState<DbSize[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSubcategories, setLoadingSubcategories] = useState(true);

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<AdditionalImage[]>([]);

  const [name, setName] = useState("");
  const [parentCategory, setParentCategory] = useState<string | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [deleteVariantIndex, setDeleteVariantIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (!error) setCategories((data as Category[]) ?? []);
      setLoadingCategories(false);
    };

    const loadSubcategories = async () => {
      setLoadingSubcategories(true);
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .order("name", { ascending: true });
      if (!error) setAllSubcategories((data as Subcategory[]) ?? []);
      setLoadingSubcategories(false);
    };

    loadCategories();
    loadSubcategories();
  }, []);

  useEffect(() => {
    if (!productId) return;
    supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setName(data.name);
        setPrice(String(data.price));
        setMoq(String(data.moq));
        setDescription(data.description ?? "");
        setParentCategoryId(data.category_id ?? null);
        setSubCategoryId(data.subcategory_id ?? null);
        if (data.category_id) {
          supabase
            .from("categories")
            .select("name")
            .eq("id", data.category_id)
            .single()
            .then(({ data: cat }) => {
              if (cat?.name) setParentCategory(cat.name);
            });
        }
        if (data.subcategory_id) {
          supabase
            .from("subcategories")
            .select("name")
            .eq("id", data.subcategory_id)
            .single()
            .then(({ data: sub }) => {
              if (sub?.name) setCategory(sub.name);
            });
        }
      });
  }, [productId]);

  useEffect(() => {
    if (parentCategoryId && allSubcategories.length > 0) {
      setFilteredSubcategories(
        allSubcategories.filter(
          (subcat) => String(subcat.category_id) === String(parentCategoryId)
        )
      );
    } else {
      setFilteredSubcategories([]);
    }
  }, [parentCategoryId, allSubcategories]);

  useEffect(() => {
    if (!parentCategory) {
      setAvailableSizes([]);
      return;
    }

    const requestId = ++sizesRequestIdRef.current;

    const fetchSizes = async () => {
      const { data, error } = await supabase
        .from("sizes")
        .select("id, label, category")
        .eq("category", parentCategory.toLowerCase())
        .order("sort_order", { ascending: true });

      if (requestId !== sizesRequestIdRef.current) return;
      if (error) {
        setAvailableSizes([]);
        return;
      }
      setAvailableSizes((data as DbSize[]) ?? []);
    };

    fetchSizes();
  }, [parentCategory]);

  useEffect(() => {
    if (!mainImage) {
      setMainPreview(null);
      return;
    }
    const url = URL.createObjectURL(mainImage);
    setMainPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [mainImage]);

  useEffect(() => {
    return () => {
      additionalImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [additionalImages]);

  const handleSelectCategory = (subcatId: string) => {
    setSubCategoryId(subcatId);
    const selected = filteredSubcategories.find((s) => s.id === subcatId);
    setCategory(selected?.name || "");
  };

  const handleParentCategorySelect = (item: Category) => {
    setParentCategory(item.name);
    setParentCategoryId(item.id);
    setCategory("");
    setSubCategoryId(null);
    setVariants([]);
  };

  const addColorVariant = () => {
    setVariants((prev) => [...prev, { color: "", sizes: [] }]);
  };

  const toggleSizeSelection = (variantIndex: number, size: DbSize) => {
    setVariants((prev) => {
      const next = prev.map((v) => ({
        ...v,
        sizes: v.sizes.map((s) => ({ ...s })),
      }));
      const variant = next[variantIndex];
      if (!variant) return prev;

      const exists = variant.sizes.find((s) => s.size_id === size.id);
      if (exists) {
        variant.sizes = variant.sizes.filter((s) => s.size_id !== size.id);
      } else {
        variant.sizes.push({
          size_id: size.id,
          label: size.label,
          stock: "",
        });
      }
      return next;
    });
  };

  const updateStock = (
    variantIndex: number,
    sizeIndex: number,
    stockValue: string
  ) => {
    setVariants((prev) => {
      const next = prev.map((v) => ({
        ...v,
        sizes: v.sizes.map((s) => ({ ...s })),
      }));
      next[variantIndex].sizes[sizeIndex].stock = stockValue.replace(
        /[^0-9]/g,
        ""
      );
      return next;
    });
  };

  const handleAdditionalFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_ADDITIONAL_IMAGES - additionalImages.length;
    if (remaining <= 0) {
      alert(`You can add up to ${MAX_ADDITIONAL_IMAGES} additional images.`);
      return;
    }

    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setAdditionalImages((prev) =>
      [...prev, ...picked].slice(0, MAX_ADDITIONAL_IMAGES)
    );
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateCreateForm = (): string | null => {
    if (profile?.store_type !== "wholesale") {
      return "Only wholesale seller accounts can upload products.";
    }
    if (profile?.status === "freeze") {
      return "Your account is frozen. You cannot upload products right now.";
    }
    if (profile?.status === "restricted") {
      return "Your account is restricted. You cannot upload products right now.";
    }
    if (!mainImage) return "Please upload a main image.";
    if (!name.trim()) return "Please enter the product name.";
    if (!parentCategoryId) return "Please select a parent category.";
    if (!subCategoryId || !category.trim()) return "Please select a sub-category.";
    if (parsePositiveNumber(price) == null) return "Please enter a valid price.";
    if (parsePositiveInt(moq) == null) return "Please enter a valid MOQ.";
    if (plainTextFromHtml(description).length === 0) {
      return "Please enter a product description.";
    }
    if (variants.length === 0) return "Add at least one color variant.";

    const colorKeys = new Set<string>();
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (!variant.color.trim()) {
        return `Please enter a color name for variant ${i + 1}.`;
      }
      const colorKey = variant.color.trim().toLowerCase();
      if (colorKeys.has(colorKey)) {
        return "Each color variant must be unique.";
      }
      colorKeys.add(colorKey);

      if (variant.sizes.length === 0) {
        return `Select at least one size for ${variant.color}.`;
      }
      for (const size of variant.sizes) {
        if (parsePositiveInt(size.stock) == null) {
          return `Enter valid stock for ${variant.color} - ${size.label}.`;
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (productId) {
      const priceNum = parsePositiveNumber(price);
      const moqNum = parsePositiveInt(moq);
      if (!name.trim() || !priceNum || !moqNum || !parentCategoryId || !subCategoryId) {
        alert("Fill all required fields");
        return;
      }

      setSubmitting(true);
      try {
        const { error } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            price: String(priceNum),
            moq: moqNum,
            description,
            category_id: parentCategoryId,
            subcategory_id: subCategoryId,
            selected_category: category.trim(),
          })
          .eq("id", productId);
        if (error) throw error;
        alert("Product updated!");
        router.push("/account");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Update failed";
        alert(message);
      }
      setSubmitting(false);
      return;
    }

    const validationError = validateCreateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setSubmitting(true);
    let createdProductId: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      const parsedPrice = parsePositiveNumber(price)!;
      const parsedMoq = parsePositiveInt(moq)!;

      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert({
          seller_id: sellerId,
          name: name.trim(),
          description: description.trim(),
          category_id: parentCategoryId,
          selected_category: category.trim(),
          subcategory_id: subCategoryId,
          price: parsedPrice,
          moq: parsedMoq,
          active: true,
          status: "active",
          is_deleted: false,
        })
        .select("id")
        .single();

      if (productError || !productData) {
        throw new Error(productError?.message || "Failed to create product");
      }

      createdProductId = productData.id;
      const newProductId = productData.id;
      const folder = `products/${newProductId}`;

      const mainUpload = await uploadProductImageFile(
        mainImage!,
        `${folder}/main`
      );
      uploadedPaths.push(mainUpload.path);

      const { error: mainImageError } = await supabase.from("product_images").insert({
        product_id: newProductId,
        image_url: mainUpload.publicUrl,
        is_main: true,
        sort_order: 0,
      });
      if (mainImageError) {
        throw new Error(mainImageError.message || "Failed to save main image");
      }

      if (additionalImages.length > 0) {
        const additionalRows: {
          product_id: string;
          image_url: string;
          is_main: boolean;
          sort_order: number;
        }[] = [];

        for (let i = 0; i < additionalImages.length; i++) {
          const uploaded = await uploadProductImageFile(
            additionalImages[i].file,
            `${folder}/additional`
          );
          uploadedPaths.push(uploaded.path);
          additionalRows.push({
            product_id: newProductId,
            image_url: uploaded.publicUrl,
            is_main: false,
            sort_order: i + 1,
          });
        }

        const { error: additionalImagesError } = await supabase
          .from("product_images")
          .insert(additionalRows);
        if (additionalImagesError) {
          throw new Error(
            additionalImagesError.message || "Failed to save additional images"
          );
        }
      }

      for (const variant of variants) {
        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .insert({
            product_id: newProductId,
            color: variant.color.trim(),
          })
          .select("id")
          .single();

        if (variantError || !variantData) {
          throw new Error(
            variantError?.message || `Failed to save color ${variant.color}`
          );
        }

        const sizesData = variant.sizes.map((size) => ({
          variant_id: variantData.id,
          size_id: size.size_id,
          size: size.label,
          stock: parsePositiveInt(size.stock)!,
        }));

        const { error: sizesError } = await supabase
          .from("product_sizes")
          .insert(sizesData);
        if (sizesError) {
          throw new Error(
            sizesError.message || `Failed to save sizes for ${variant.color}`
          );
        }
      }

      alert("Product uploaded successfully!");
      router.push("/account");
    } catch (err: unknown) {
      if (createdProductId) await softDeleteProduct(createdProductId);
      if (uploadedPaths.length) await removeProductStoragePaths(uploadedPaths);
      const message = err instanceof Error ? err.message : "Upload failed";
      alert(message);
    }

    setSubmitting(false);
  };

  const submitDisabled =
    submitting ||
    (!productId &&
      (profile?.store_type !== "wholesale" ||
        profile?.status === "freeze" ||
        profile?.status === "restricted"));

  const submitLabel = productId
    ? submitting
      ? "Saving..."
      : "Update Product"
    : submitting
      ? "Saving..."
      : profile?.store_type !== "wholesale"
        ? "Sellers Only"
        : profile?.status === "freeze"
          ? "Account Frozen"
          : profile?.status === "restricted"
            ? "Upload Restricted"
            : "Upload Product";

  return (
    <div>
      <PageHeader
        title={productId ? "Edit Product" : "Upload Product"}
        description="Add a new product to your store"
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-8">
          {!productId && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Product Media
              </h2>
              <button
                type="button"
                onClick={() => mainInputRef.current?.click()}
                className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface text-sm text-muted"
              >
                {mainPreview ? (
                  <Image
                    src={mainPreview}
                    alt="Main product"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  "Upload Main Image"
                )}
              </button>
              <input
                ref={mainInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setMainImage(e.target.files?.[0] ?? null)}
              />

              <div className="flex gap-2 overflow-x-auto pb-1">
                {additionalImages.map((img, i) => (
                  <div key={`${img.preview}-${i}`} className="relative shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                      <Image
                        src={img.preview}
                        alt={`Additional ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {additionalImages.length < MAX_ADDITIONAL_IMAGES && (
                  <button
                    type="button"
                    onClick={() => additionalInputRef.current?.click()}
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-2xl text-muted"
                  >
                    +
                  </button>
                )}
              </div>
              <input
                ref={additionalInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleAdditionalFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Target Category
            </h2>
            {loadingCategories ? (
              <p className="text-sm text-muted">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-red-600">No categories available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleParentCategorySelect(item)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition-colors ${
                      parentCategory === item.name
                        ? "border-foreground bg-foreground text-white"
                        : "border-border bg-white text-foreground hover:bg-surface"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          {parentCategoryId && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Sub Category
              </h2>
              {loadingSubcategories ? (
                <p className="text-sm text-muted">Loading subcategories...</p>
              ) : filteredSubcategories.length === 0 ? (
                <p className="text-sm text-muted">
                  No subcategories available for this category.
                </p>
              ) : (
                <select
                  value={subCategoryId ?? ""}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                  className={fieldClass}
                  required
                >
                  <option value="">Select sub-category</option>
                  {filteredSubcategories.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </option>
                  ))}
                </select>
              )}
            </section>
          )}

          <section className="space-y-3">
            <input
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              required
            />
            <input
              placeholder="Price (BDT) Per Item"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
              required
            />
            <input
              placeholder="MOQ"
              value={moq}
              onChange={(e) => setMoq(e.target.value)}
              inputMode="numeric"
              className={fieldClass}
              required
            />
            <RichTextEditor value={description} onChange={setDescription} />
          </section>

          {!productId && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Inventory Variants
              </h2>

              {variants.map((variant, vIdx) => (
                <div
                  key={vIdx}
                  className="space-y-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Color (e.g. Red)"
                      value={variant.color}
                      onChange={(e) => {
                        const next = variants.map((v) => ({
                          ...v,
                          sizes: v.sizes.map((s) => ({ ...s })),
                        }));
                        next[vIdx].color = e.target.value;
                        setVariants(next);
                      }}
                      className={`${fieldClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => setDeleteVariantIndex(vIdx)}
                      className="rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                      aria-label="Delete variant"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="text-xs font-semibold uppercase text-muted">
                    Select Sizes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const isSelected = variant.sizes.some(
                        (s) => s.size_id === size.id
                      );
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => toggleSizeSelection(vIdx, size)}
                          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                            isSelected
                              ? "border-foreground bg-foreground text-white"
                              : "border-border bg-white text-foreground hover:bg-surface"
                          }`}
                        >
                          {size.label}
                        </button>
                      );
                    })}
                  </div>

                  {variant.sizes.map((sEntry, sIdx) => (
                    <div key={sEntry.size_id} className="flex items-center gap-3">
                      <span className="w-16 text-sm font-semibold">
                        {sEntry.label}:
                      </span>
                      <input
                        placeholder="Quantity"
                        value={sEntry.stock}
                        inputMode="numeric"
                        onChange={(e) => updateStock(vIdx, sIdx, e.target.value)}
                        className={`${fieldClass} flex-1`}
                      />
                    </div>
                  ))}
                </div>
              ))}

              {parentCategory && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addColorVariant}
                  className="w-full"
                >
                  + Add Color Variant
                </Button>
              )}
            </section>
          )}

          <Button type="submit" disabled={submitDisabled} className="w-full">
            {submitLabel}
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={deleteVariantIndex !== null}
        title="Delete variant?"
        description="This color and its sizes will be removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => setDeleteVariantIndex(null)}
        onConfirm={() => {
          if (deleteVariantIndex !== null) {
            setVariants((prev) =>
              prev.filter((_, i) => i !== deleteVariantIndex)
            );
          }
          setDeleteVariantIndex(null);
        }}
      />
    </div>
  );
}
