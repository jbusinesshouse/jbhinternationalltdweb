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
import {
  isProductListingAccount,
  minimumOrderQuantityForStoreType,
  moqValidationMessage,
} from "@/lib/moqRules";
import { apiRequest, newIdempotencyKey } from "@/lib/api";
import type { UserProfile } from "@/lib/profile";
import { categoryLabel } from "@/lib/labels";
import { buyerPriceVatHint } from "@/lib/vat";

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
  "w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted";

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
    const load = async () => {
      setLoadingCategories(true);
      setLoadingSubcategories(true);
      try {
        const res = await apiRequest<{ categories: Category[] }>("/categories", { auth: false });
        const cats = (res.categories ?? []).sort((x, y) => x.name.localeCompare(y.name));
        setCategories(cats);
        setLoadingCategories(false);
        const lists = await Promise.all(
          cats.map((c) =>
            apiRequest<{ subcategories: { id: string; name: string }[] }>(
              `/categories/${c.id}/subcategories`,
              { auth: false }
            ).then((r) => (r.subcategories ?? []).map((sc) => ({ ...sc, category_id: c.id })))
          )
        );
        setAllSubcategories(lists.flat().sort((x, y) => x.name.localeCompare(y.name)));
      } catch {
        // leave the lists empty; the form shows its empty states
      }
      setLoadingCategories(false);
      setLoadingSubcategories(false);
    };
    void load();
  }, []);

  useEffect(() => {
    if (!productId) return;
    apiRequest<{
      product: {
        name: string;
        price: number | string;
        price_base?: number;
        moq: number;
        description: string | null;
        category_id: string | null;
        subcategory_id: string | null;
        selected_category?: string | null;
      };
    }>(`/products/${productId}`, { auth: true })
      .then(({ product: data }) => {
        setName(data.name);
        // The form edits the seller's base price; the API returns the buyer (VAT-incl.) price too.
        setPrice(String(data.price_base ?? data.price));
        setMoq(String(data.moq));
        setDescription(data.description ?? "");
        setParentCategoryId(data.category_id ?? null);
        setSubCategoryId(data.subcategory_id ?? null);
        if (data.selected_category) setCategory(data.selected_category);
      })
      .catch(() => {});
  }, [productId]);

  // Resolve category / subcategory names once the lists are loaded (edit mode).
  useEffect(() => {
    if (parentCategoryId) {
      const cat = categories.find((c) => c.id === parentCategoryId);
      if (cat) setParentCategory(cat.name);
    }
    if (subCategoryId) {
      const sub = allSubcategories.find((sc) => sc.id === subCategoryId);
      if (sub) setCategory(sub.name);
    }
  }, [parentCategoryId, subCategoryId, categories, allSubcategories]);

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
      try {
        const res = await apiRequest<{ sizes: DbSize[] }>(
          `/sizes?category=${encodeURIComponent(parentCategory.toLowerCase())}`,
          { auth: false }
        );
        if (requestId !== sizesRequestIdRef.current) return;
        setAvailableSizes(res.sizes ?? []);
      } catch {
        if (requestId !== sizesRequestIdRef.current) return;
        setAvailableSizes([]);
      }
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
      alert(`সর্বোচ্চ ${MAX_ADDITIONAL_IMAGES.toLocaleString("bn-BD")}টি অতিরিক্ত ছবি দেওয়া যাবে।`);
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

  const minOrderQty = minimumOrderQuantityForStoreType(profile?.store_type);

  const validateCreateForm = (): string | null => {
    if (!isProductListingAccount(profile?.store_type)) {
      return "শুধু খুচরা বা পাইকারি সেলার অ্যাকাউন্ট পণ্য আপলোড করতে পারে।";
    }
    if (profile?.status === "freeze") {
      return "আপনার অ্যাকাউন্ট ফ্রিজ করা আছে, এখন পণ্য আপলোড করা যাবে না।";
    }
    if (profile?.status === "restricted") {
      return "আপনার অ্যাকাউন্ট যাচাইয়ের অপেক্ষায় আছে, এখন পণ্য আপলোড করা যাবে না।";
    }
    if (!mainImage) return "প্রধান ছবি দিন।";
    if (!name.trim()) return "পণ্যের নাম দিন।";
    if (!parentCategoryId) return "ক্যাটাগরি বাছাই করুন।";
    if (!subCategoryId || !category.trim()) return "সাব-ক্যাটাগরি বাছাই করুন।";
    if (parsePositiveNumber(price) == null) return "সঠিক দাম দিন।";
    const moqError = moqValidationMessage(
      profile?.store_type,
      parsePositiveInt(moq)
    );
    if (moqError) return moqError;
    if (plainTextFromHtml(description).length === 0) {
      return "পণ্যের বিবরণ লিখুন।";
    }
    if (variants.length === 0) return "কমপক্ষে একটি রং যোগ করুন।";

    const colorKeys = new Set<string>();
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (!variant.color.trim()) {
        return `${(i + 1).toLocaleString("bn-BD")} নম্বর রঙের নাম দিন।`;
      }
      const colorKey = variant.color.trim().toLowerCase();
      if (colorKeys.has(colorKey)) {
        return "প্রতিটি রং আলাদা হতে হবে।";
      }
      colorKeys.add(colorKey);

      if (variant.sizes.length === 0) {
        return `"${variant.color}" রঙের জন্য কমপক্ষে একটি সাইজ বাছাই করুন।`;
      }
      for (const size of variant.sizes) {
        if (parsePositiveInt(size.stock) == null) {
          return `"${variant.color}" - ${size.label} সাইজের সঠিক স্টক দিন।`;
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
      const editMoqError = moqValidationMessage(profile?.store_type, moqNum);
      if (!name.trim() || !priceNum || !moqNum || !parentCategoryId || !subCategoryId) {
        alert(editMoqError ?? "সব প্রয়োজনীয় ঘর পূরণ করুন");
        return;
      }
      if (editMoqError) {
        alert(editMoqError);
        return;
      }

      setSubmitting(true);
      try {
        await apiRequest(`/products/${productId}`, {
          method: "PATCH",
          auth: true,
          body: {
            name: name.trim(),
            price: priceNum,
            moq: moqNum,
            description,
            category_id: parentCategoryId,
            subcategory_id: subCategoryId,
            selected_category: category.trim(),
          },
        });
        alert("পণ্য আপডেট হয়েছে!");
        router.push("/account");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "আপডেট করা যায়নি";
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
    const uploadedPaths: string[] = [];

    try {
      const parsedPrice = parsePositiveNumber(price)!;
      const parsedMoq = parsePositiveInt(moq)!;

      // Upload first; the API then creates the product, images and variants in one call.
      const mainUpload = await uploadProductImageFile(mainImage!);
      uploadedPaths.push(mainUpload.path);
      const images = [{ image_url: mainUpload.publicUrl, is_main: true, sort_order: 0 }];

      for (let i = 0; i < additionalImages.length; i++) {
        const uploaded = await uploadProductImageFile(additionalImages[i].file);
        uploadedPaths.push(uploaded.path);
        images.push({ image_url: uploaded.publicUrl, is_main: false, sort_order: i + 1 });
      }

      await apiRequest<{ id: string }>("/products", {
        method: "POST",
        auth: true,
        idempotencyKey: newIdempotencyKey(),
        body: {
          name: name.trim(),
          description: description.trim(),
          category_id: parentCategoryId,
          subcategory_id: subCategoryId,
          selected_category: category.trim(),
          price: parsedPrice,
          moq: parsedMoq,
          images,
          variants: variants.map((v) => ({
            color: v.color.trim(),
            sizes: v.sizes.map((size) => ({
              size_id: size.size_id,
              size: size.label,
              stock: parsePositiveInt(size.stock)!,
            })),
          })),
        },
      });

      alert("পণ্য আপলোড হয়েছে!");
      router.push("/account");
    } catch (err: unknown) {
      if (uploadedPaths.length) await removeProductStoragePaths(uploadedPaths);
      const message = err instanceof Error ? err.message : "আপলোড করা যায়নি";
      alert(message);
    }

    setSubmitting(false);
  };

  const submitDisabled =
    submitting ||
    (!productId &&
      (!isProductListingAccount(profile?.store_type) ||
        profile?.status === "freeze" ||
        profile?.status === "restricted"));

  const submitLabel = productId
    ? submitting
      ? "সেভ হচ্ছে..."
      : "পণ্য আপডেট করুন"
    : submitting
      ? "সেভ হচ্ছে..."
      : !isProductListingAccount(profile?.store_type)
        ? "শুধু সেলারদের জন্য"
        : profile?.status === "freeze"
          ? "অ্যাকাউন্ট ফ্রিজ করা"
          : profile?.status === "restricted"
            ? "আপলোড বন্ধ আছে"
            : "পণ্য আপলোড করুন";

  return (
    <div>
      <PageHeader
        title={productId ? "পণ্য এডিট করুন" : "নতুন পণ্য আপলোড"}
        description={productId ? "পণ্যের তথ্য আপডেট করুন" : "আপনার দোকানে নতুন পণ্য যোগ করুন"}
      />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {!productId && (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-extrabold">পণ্যের ছবি</h2>
              <button
                type="button"
                onClick={() => mainInputRef.current?.click()}
                className="relative flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#D1D5DB] bg-surface text-sm font-semibold text-muted transition-colors hover:border-primary"
              >
                {mainPreview ? (
                  <Image
                    src={mainPreview}
                    alt="প্রধান ছবির প্রিভিউ"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  "প্রধান ছবি দিন (বাধ্যতামূলক)"
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
                    <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                      <Image
                        src={img.preview}
                        alt={`অতিরিক্ত ছবি ${(i + 1).toLocaleString("bn-BD")}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#B42318] text-sm text-white"
                      aria-label="ছবি সরান"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {additionalImages.length < MAX_ADDITIONAL_IMAGES && (
                  <button
                    type="button"
                    onClick={() => additionalInputRef.current?.click()}
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[#D1D5DB] bg-surface text-2xl text-muted hover:border-primary"
                    aria-label="আরও ছবি যোগ করুন"
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

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-extrabold">ক্যাটাগরি</h2>
            {loadingCategories ? (
              <p className="text-sm text-muted">ক্যাটাগরি লোড হচ্ছে...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-[#B42318]">কোনো ক্যাটাগরি পাওয়া যায়নি।</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleParentCategorySelect(item)}
                    className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
                      parentCategory === item.name
                        ? "border-primary bg-primary-soft text-foreground"
                        : "border-border bg-white text-foreground hover:border-primary/60"
                    }`}
                  >
                    {categoryLabel(item.name, true)}
                  </button>
                ))}
              </div>
            )}
          </section>

          {parentCategoryId && (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-extrabold">সাব-ক্যাটাগরি</h2>
              {loadingSubcategories ? (
                <p className="text-sm text-muted">লোড হচ্ছে...</p>
              ) : filteredSubcategories.length === 0 ? (
                <p className="text-sm text-muted">এই ক্যাটাগরির কোনো সাব-ক্যাটাগরি নেই।</p>
              ) : (
                <select
                  value={subCategoryId ?? ""}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                  className={fieldClass}
                  required
                >
                  <option value="">সাব-ক্যাটাগরি বাছাই করুন</option>
                  {filteredSubcategories.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </option>
                  ))}
                </select>
              )}
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-extrabold">পণ্যের তথ্য</h2>
            <input
              placeholder="পণ্যের নাম"
              aria-label="পণ্যের নাম"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              required
            />
            <input
              placeholder="প্রতি পিসের দাম (টাকা, ভ্যাট ছাড়া)"
              aria-label="প্রতি পিসের দাম"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
              required
            />
            {(() => {
              const vatHint = buyerPriceVatHint(price, profile?.store_type);
              return vatHint ? (
                <p className="-mt-1 text-xs text-muted">{vatHint}</p>
              ) : null;
            })()}
            <input
              placeholder={minOrderQty != null ? `MOQ — সর্বনিম্ন অর্ডার (কমপক্ষে ${minOrderQty.toLocaleString("bn-BD")})` : "MOQ — সর্বনিম্ন অর্ডার"}
              aria-label="MOQ"
              value={moq}
              onChange={(e) => setMoq(e.target.value)}
              inputMode="numeric"
              className={fieldClass}
              required
            />
            <RichTextEditor value={description} onChange={setDescription} />
          </section>

          {!productId && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-extrabold">রং ও সাইজ (স্টক)</h2>

              {variants.map((variant, vIdx) => (
                <div
                  key={vIdx}
                  className="flex flex-col gap-3 rounded-2xl border border-border p-4"
                >
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="রঙের নাম (যেমন: লাল)"
                      aria-label="রঙের নাম"
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
                      className="rounded-xl px-3 py-2 text-sm font-bold text-[#B42318] hover:bg-[#FEECEC]"
                      aria-label="এই রং মুছুন"
                    >
                      মুছুন
                    </button>
                  </div>

                  <p className="text-sm font-bold text-muted">সাইজ বাছাই করুন</p>
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
                          aria-pressed={isSelected}
                          className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition-colors ${
                            isSelected
                              ? "border-primary bg-primary-soft text-foreground"
                              : "border-border bg-white text-foreground hover:border-primary/60"
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
                        placeholder="স্টক (পিস)"
                        aria-label={`${sEntry.label} স্টক`}
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
                  + নতুন রং যোগ করুন
                </Button>
              )}
            </section>
          )}

          <Button type="submit" size="lg" disabled={submitDisabled} className="w-full">
            {submitLabel}
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={deleteVariantIndex !== null}
        title="এই রংটি মুছবেন?"
        description="রংটি ও তার সব সাইজ মুছে যাবে।"
        confirmLabel="মুছুন"
        cancelLabel="বাতিল"
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
