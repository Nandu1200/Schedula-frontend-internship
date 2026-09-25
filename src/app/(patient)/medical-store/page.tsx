"use client";

import { useEffect, useMemo, useState } from "react";

import { medicalProducts } from "@/lib/mock-data/medicalProducts";
import type { MedicalProductCategory } from "@/types/medicalProduct";

const categoryOptions: Array<{
  value: "all" | MedicalProductCategory;
  label: string;
}> = [
  { value: "all", label: "All Products" },
  { value: "medicines", label: "Medicines" },
  { value: "vitamins", label: "Vitamins" },
  { value: "wellness", label: "Wellness" },
  { value: "medical-devices", label: "Medical Devices" },
  { value: "personal-care", label: "Personal Care" },
];

const categoryIconMap: Record<
  MedicalProductCategory,
  string
> = {
  medicines: "💊",
  vitamins: "🧴",
  wellness: "💧",
  "medical-devices": "🩺",
  "personal-care": "🧼",
};

type MedicalCartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
};

const formatCategoryLabel = (
  category: MedicalProductCategory
) => {
  switch (category) {
    case "medical-devices":
      return "Medical Devices";

    case "personal-care":
      return "Personal Care";

    case "medicines":
      return "Medicines";

    case "vitamins":
      return "Vitamins";

    case "wellness":
      return "Wellness";

    default:
      return category;
  }
};

type SelectedPrescription = {
  appointmentId: string;
  doctorName: string;
  diagnosis: string;
  medicines: Array<{
    name: string;
    dosage: string;
    duration: string;
  }>;
};

export default function MedicalStorePage() {
  const [selectedPrescription, setSelectedPrescription] =
    useState<SelectedPrescription | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | MedicalProductCategory
  >("all");

  const [selectedProductId, setSelectedProductId] =
    useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return medicalProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        product.category === selectedCategory;

      if (!normalizedSearch) {
        return matchesCategory;
      }

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.brand
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.description
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const selectedProduct =
    medicalProducts.find(
      (product) => product.id === selectedProductId
    ) ?? null;

  const [cartItems, setCartItems] = useState<MedicalCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const storedPrescription = localStorage.getItem(
        "medicalStoreSelectedPrescription"
      );

      if (!storedPrescription) {
        return;
      }

      const parsedPrescription = JSON.parse(
        storedPrescription
      ) as SelectedPrescription;

      if (
        parsedPrescription &&
        Array.isArray(parsedPrescription.medicines)
      ) {
        setSelectedPrescription(parsedPrescription);
      }
    } catch {
      setSelectedPrescription(null);
    }
  }, []);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(
        "medicalStoreCart"
      );

      if (!storedCart) {
        return;
      }

      const parsedCart = JSON.parse(
        storedCart
      ) as MedicalCartItem[];

      if (Array.isArray(parsedCart)) {
        setCartItems(parsedCart);
      }
    } catch {
      setCartItems([]);
    }
  }, []);

  const persistCart = (nextCart: MedicalCartItem[]) => {
    setCartItems(nextCart);
    localStorage.setItem(
      "medicalStoreCart",
      JSON.stringify(nextCart)
    );
    window.dispatchEvent(
      new Event("medical-cart-updated")
    );
  };

  const addToCart = (productId: string) => {
    const product = medicalProducts.find(
      (item) => item.id === productId
    );

    if (!product || !product.inStock) {
      return;
    }

    const existingItem = cartItems.find(
      (item) => item.productId === productId
    );

    if (existingItem) {
      persistCart(
        cartItems.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      persistCart([
        ...cartItems,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          prescriptionRequired:
            product.prescriptionRequired,
        },
      ]);
    }

    setCartOpen(true);
  };

  const updateCartQuantity = (
    productId: string,
    nextQuantity: number
  ) => {
    if (nextQuantity <= 0) {
      persistCart(
        cartItems.filter(
          (item) => item.productId !== productId
        )
      );
      return;
    }

    persistCart(
      cartItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: nextQuantity,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    persistCart(
      cartItems.filter(
        (item) => item.productId !== productId
      )
    );
  };

  const clearCart = () => {
    persistCart([]);
  };

  const cartItemCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const prescriptionMatches = useMemo(() => {
    if (!selectedPrescription) {
      return [];
    }

    /*
     * Prescription medicine names can contain strength or
     * dosage words, for example:
     *
     *   Paracetamol
     *   Paracetamol 500mg
     *   Paracetamol 500 mg tablet
     *
     * The store catalogue may use a slightly different
     * version of the same name. Normalize the medicine
     * name before matching so the prescription handoff
     * reliably finds the catalogue product.
     */
    const normalizeMedicineName = (value: string) =>
      value
        .toLowerCase()
        .replace(/([0-9]+)\s*(mg|mcg|g|kg|ml|l)\b/g, " ")
        .replace(/\b(mg|mcg|g|kg|ml|l)\b/g, " ")
        .replace(/\b(tablets?|capsules?|tablet|capsule|tabs?|caps?)\b/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const getWords = (value: string) =>
      normalizeMedicineName(value)
        .split(" ")
        .filter((word) => word.length > 1);

    const medicineMatchesProduct = (
      medicineName: string,
      productName: string
    ) => {
      const normalizedMedicine =
        normalizeMedicineName(medicineName);
      const normalizedProduct =
        normalizeMedicineName(productName);

      if (!normalizedMedicine || !normalizedProduct) {
        return false;
      }

      if (
        normalizedMedicine === normalizedProduct ||
        normalizedProduct.includes(normalizedMedicine) ||
        normalizedMedicine.includes(normalizedProduct)
      ) {
        return true;
      }

      const medicineWords = getWords(medicineName);
      const productWords = getWords(productName);

      return (
        medicineWords.length > 0 &&
        medicineWords.every((word) =>
          productWords.includes(word)
        )
      );
    };

    return selectedPrescription.medicines.map((medicine) => {
      const product = medicalProducts.find((item) =>
        medicineMatchesProduct(
          medicine.name,
          item.name
        )
      );

      return {
        medicine,
        product: product ?? null,
      };
    });
  }, [selectedPrescription]);

  const addPrescriptionMedicinesToCart = () => {
    const productsToAdd = prescriptionMatches
      .map((match) => match.product)
      .filter((product) => Boolean(product?.inStock));

    if (productsToAdd.length === 0) {
      return;
    }

    let nextCart = [...cartItems];

    productsToAdd.forEach((product) => {
      if (!product) {
        return;
      }

      const existingItem = nextCart.find(
        (item) => item.productId === product.id
      );

      if (existingItem) {
        nextCart = nextCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return;
      }

      nextCart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        prescriptionRequired: product.prescriptionRequired,
      });
    });

    persistCart(nextCart);
    setCartOpen(true);

    /*
     * Keep the selected prescription available for checkout.
     * Checkout will automatically select the same prescription.
     */
    localStorage.setItem(
      "medicalStoreSelectedPrescription",
      JSON.stringify(selectedPrescription)
    );
  };

  const clearSelectedPrescription = () => {
    localStorage.removeItem("medicalStoreSelectedPrescription");
    setSelectedPrescription(null);
  };

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8 lg:px-11">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-600">
              Schedula Health Store
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Medicines & Healthcare Essentials
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Browse medicines, wellness products, personal
              care items, and everyday healthcare essentials. 
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <label
                htmlFor="medical-store-search"
                className="sr-only"
              >
                Search medicines and healthcare products
              </label>

              <input
                id="medical-store-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search medicines, products or uses..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                🔎
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                🛒 Cart
                {cartItemCount > 0 && (
                  <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-xs font-bold text-white">
                    {cartItemCount}
                  </span>
                )}
              </button>

              <div className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-800 sm:block">
                Schedula Health Store
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-11">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categoryOptions.map((category) => {
            const isActive =
              selectedCategory === category.value;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() =>
                  setSelectedCategory(category.value)
                }
                className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid size-11 place-items-center rounded-xl text-xl ${
                      isActive
                        ? "bg-white"
                        : "bg-slate-50"
                    }`}
                  >
                    {category.value === "all"
                      ? "🛍️"
                      : categoryIconMap[category.value]}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isActive
                          ? "text-emerald-800"
                          : "text-slate-800"
                      }`}
                    >
                      {category.label}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Browse products
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {selectedPrescription && (
          <section className="mt-8 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
                  Prescription Selected
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Medicines prescribed by {selectedPrescription.doctorName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedPrescription.diagnosis}
                </p>

                <div className="mt-4 space-y-2">
                  {prescriptionMatches.map((match) => (
                    <div
                      key={`${selectedPrescription.appointmentId}-${match.medicine.name}`}
                      className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm font-semibold text-slate-800">
                        {match.medicine.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {match.medicine.dosage} · {match.medicine.duration}
                      </span>
                    </div>
                  ))}
                </div>

                {prescriptionMatches.some((match) => !match.product) && (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Some prescribed medicines may not be available in the current catalogue.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  onClick={addPrescriptionMedicinesToCart}
                  disabled={
                    !prescriptionMatches.some(
                      (match) => match.product?.inStock
                    )
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Add Available Medicines to Cart
                </button>

                <button
                  type="button"
                  onClick={clearSelectedPrescription}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Clear Prescription
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {selectedCategory === "all"
                  ? "All Products"
                  : formatCategoryLabel(
                      selectedCategory
                    )}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredProducts.length} product
                {filteredProducts.length === 1 ? "" : "s"} available
              </p>
            </div>

            <p className="text-xs text-slate-400">
              
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="text-4xl">🔎</div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No products found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another product name, use, or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-2xl">
                      {categoryIconMap[product.category]}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {product.prescriptionRequired && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                          Prescription Required
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          product.inStock
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {product.inStock
                          ? "In Stock"
                          : "Out of Stock"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {formatCategoryLabel(
                        product.category
                      )}
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      {product.brand}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        {product.packSize}
                      </p>

                      <div className="mt-1 flex items-end gap-2">
                        <span className="text-xl font-extrabold text-slate-950">
                          ₹{product.price}
                        </span>

                        <span className="text-xs text-slate-400 line-through">
                          ₹{product.mrp}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProductId(product.id)
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          addToCart(product.id)
                        }
                        disabled={!product.inStock}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {product.inStock
                          ? "Add to Cart"
                          : "Out of Stock"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm">
              ℹ️
            </div>

            <div>
              <h2 className="font-bold text-emerald-900">
                About this store
              </h2>

              <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                Browse healthcare products available through Schedula Health Store.
                Product details are provided for general awareness and do not
                replace advice from a qualified healthcare
                professional. Prescription-required products are
                marked clearly in the catalogue.
              </p>
            </div>
          </div>
        </section>
      </div>


      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45">
          <div
            className="absolute inset-0"
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                  Schedula Health Store
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Your Cart
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close cart"
                onClick={() => setCartOpen(false)}
                className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="text-5xl">🛒</div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Your cart is empty
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add medicines or healthcare products to continue.
                </p>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-emerald-700">
                            ₹{item.price}
                          </p>

                          {item.prescriptionRequired && (
                            <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                              Prescription Required
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            className="px-3 py-2 text-lg font-semibold text-slate-700 hover:bg-slate-50"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            −
                          </button>

                          <span className="min-w-10 px-2 text-center text-sm font-bold text-slate-900">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            className="px-3 py-2 text-lg font-semibold text-slate-700 hover:bg-slate-50"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-extrabold text-slate-900">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-bold text-slate-900">
                      ₹{cartSubtotal}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        window.location.href = "/medical-store/checkout";
                      }}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      Proceed to Checkout
                    </button>

                    <button
                      type="button"
                      onClick={clearCart}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                  Product Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedProduct.name}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close product details"
                onClick={() =>
                  setSelectedProductId(null)
                }
                className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-3xl">
                  {categoryIconMap[
                    selectedProduct.category
                  ]}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {formatCategoryLabel(
                      selectedProduct.category
                    )}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    {selectedProduct.brand}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedProduct.prescriptionRequired && (
                      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                        Prescription Required
                      </span>
                    )}

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        selectedProduct.inStock
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {selectedProduct.inStock
                        ? "In Stock"
                        : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  About this product
                </p>

                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Pack Size
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {selectedProduct.packSize}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Price
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    ₹{selectedProduct.price}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    MRP
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    ₹{selectedProduct.mrp}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Important information
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Product information is provided for general awareness.
                  Please follow the product label and consult a
                  qualified healthcare professional when needed.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setSelectedProductId(null)
                }
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
