"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@/types/appointment";
import type { MedicalOrder } from "@/types/medicalOrder";

type MedicalCartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
};

type LoggedInPatient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
};

type PrescriptionOption = {
  id: string;
  appointmentId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medicineNames: string[];
};

type CheckoutDetails = {
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: "cod" | "upi" | "card";
};

const CART_STORAGE_KEY = "medicalStoreCart";

const getStoredCart = (): MedicalCartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedCart = localStorage.getItem(
      CART_STORAGE_KEY
    );

    if (!storedCart) {
      return [];
    }

    const parsedCart = JSON.parse(storedCart) as unknown;

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart as MedicalCartItem[];
  } catch {
    return [];
  }
};

const getStoredPatient = (): LoggedInPatient | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedPatient =
    localStorage.getItem("loggedInPatient");

  if (!storedPatient) {
    return null;
  }

  try {
    return JSON.parse(
      storedPatient
    ) as LoggedInPatient;
  } catch {
    return null;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};


const ORDERS_STORAGE_KEY = "medicalStoreOrders";

const saveMedicalOrder = (order: MedicalOrder) => {
  const storedOrders = localStorage.getItem(
    ORDERS_STORAGE_KEY
  );

  let orders: MedicalOrder[] = [];

  if (storedOrders) {
    try {
      const parsedOrders = JSON.parse(
        storedOrders
      ) as unknown;

      if (Array.isArray(parsedOrders)) {
        orders = parsedOrders as MedicalOrder[];
      }
    } catch {
      orders = [];
    }
  }

  localStorage.setItem(
    ORDERS_STORAGE_KEY,
    JSON.stringify([order, ...orders])
  );
};

export default function MedicalStoreCheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<
    MedicalCartItem[]
  >([]);

  const [patient, setPatient] =
    useState<LoggedInPatient | null>(null);

  const [prescriptions, setPrescriptions] =
    useState<PrescriptionOption[]>([]);

  const [selectedPrescriptionId, setSelectedPrescriptionId] =
    useState("");

  const [checkout, setCheckout] =
    useState<CheckoutDetails>({
      name: "",
      phone: "",
      address: "",
      city: "",
      pincode: "",
      paymentMethod: "cod",
    });

  const [error, setError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<MedicalOrder | null>(null);

  useEffect(() => {
    const storedCart = getStoredCart();
    const storedPatient = getStoredPatient();

    setCartItems(storedCart);
    setPatient(storedPatient);

    if (storedPatient) {
      setCheckout({
        name: storedPatient.name ?? "",
        phone: storedPatient.phone ?? "",
        address: "",
        city: "",
        pincode: "",
        paymentMethod: "cod",
      });
    }

    try {
      const storedAppointments =
        localStorage.getItem("appointments");

      if (!storedAppointments || !storedPatient) {
        return;
      }

      const allAppointments =
        JSON.parse(
          storedAppointments
        ) as Appointment[];

      const patientPrescriptions: PrescriptionOption[] =
        allAppointments
          .filter(
            (appointment) =>
              appointment.patient.id ===
                storedPatient.id &&
              Boolean(appointment.prescription)
          )
          .map((appointment) => ({
            id: appointment.prescription?.id ?? appointment.id,
            appointmentId: appointment.id,
            doctorName: appointment.clinician,
            date: appointment.startsAt,
            diagnosis:
              appointment.prescription?.diagnosis ??
              "Consultation",
            medicineNames:
              appointment.prescription?.medicines.map(
                (medicine) => medicine.name
              ) ?? [],
          }));

      setPrescriptions(patientPrescriptions);

      const storedSelectedPrescription = localStorage.getItem(
        "medicalStoreSelectedPrescription"
      );

      if (storedSelectedPrescription) {
        try {
          const selected = JSON.parse(
            storedSelectedPrescription
          ) as {
            appointmentId?: string;
            id?: string;
          };

          const matchingPrescription =
            patientPrescriptions.find(
              (prescription) =>
                (selected.id &&
                  prescription.id === selected.id) ||
                (selected.appointmentId &&
                  prescription.appointmentId ===
                    selected.appointmentId)
            );

          if (matchingPrescription) {
            setSelectedPrescriptionId(
              matchingPrescription.id
            );
          }
        } catch {
          // Ignore invalid stored prescription data.
        }
      }
    } catch {
      setPrescriptions([]);
    }
  }, []);

  const requiresPrescription = useMemo(() => {
    return cartItems.some(
      (item) => item.prescriptionRequired
    );
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const deliveryFee = subtotal > 499 ? 0 : 40;

  const total = subtotal + deliveryFee;

  const selectedPrescription =
    prescriptions.find(
      (prescription) =>
        prescription.id === selectedPrescriptionId
    ) ?? null;

  const updateCheckout = (
    field: keyof CheckoutDetails,
    value: string
  ) => {
    setCheckout((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleReviewOrder = () => {
    setError("");

  
  if (!patient) {
      setError(
        "Please login as a patient before continuing."
      );
      return;
    }

    if (cartItems.length === 0) {
      setError(
        "Your cart is empty. Please add products first."
      );
      return;
    }

    if (!checkout.name.trim()) {
      setError("Please enter the delivery name.");
      return;
    }

    const phoneDigits = checkout.phone.replace(
      /\D/g,
      ""
    );

    if (phoneDigits.length !== 10) {
      setError(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    if (checkout.address.trim().length < 8) {
      setError(
        "Please enter a complete delivery address."
      );
      return;
    }

    if (!checkout.city.trim()) {
      setError("Please enter the delivery city.");
      return;
    }

    if (!/^\d{6}$/.test(checkout.pincode)) {
      setError(
        "Please enter a valid 6-digit pincode."
      );
      return;
    }

    if (
      requiresPrescription &&
      !selectedPrescription
    ) {
      setError(
        "Please select a prescription for the prescription-required medicine in your cart."
      );
      return;
    }

    setReviewOpen(true);
  };


const handlePlaceOrder = () => {
  if (!patient || cartItems.length === 0) {
    return;
  }

  const orderId = `SCH-${Date.now().toString().slice(-8)}`;
  const createdAt = new Date().toISOString();

  const deliveryDate = new Date();
  deliveryDate.setDate(
    deliveryDate.getDate() + 4
  );

  const order: MedicalOrder = {
    id: orderId,
    patientId: patient.id,
    items: cartItems,
    subtotal,
    deliveryFee,
    total,
    paymentMethod:
      checkout.paymentMethod,
    paymentStatus:
      checkout.paymentMethod === "cod"
        ? "pending"
        : "paid",
    prescriptionId:
      selectedPrescription?.id,
    deliveryAddress: {
      name: checkout.name.trim(),
      phone: checkout.phone.trim(),
      address: checkout.address.trim(),
      city: checkout.city.trim(),
      pincode: checkout.pincode,
    },
    status: "placed",
    createdAt,
    estimatedDeliveryDate:
      deliveryDate.toISOString(),
  };

  saveMedicalOrder(order);
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(
    new Event("medical-order-updated")
  );

  setPlacedOrder(order);
  setOrderPlaced(true);
  setReviewOpen(false);
};

  if (!patient) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">👤</div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Patient Login Required
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please login to continue with your Health
            Store order.
          </p>

          <button
            type="button"
            onClick={() => router.push("/login/patient")}
            className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Patient Login
          </button>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7faf9] px-5 py-10 sm:px-8 lg:px-11">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">🛒</div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add medicines or healthcare products before
            continuing to checkout.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/medical-store")
            }
            className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-11">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
              Schedula Health Store
            </p>

            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Checkout
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/medical-store")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            Back to Store
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-11">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                Delivery Details
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Where should we deliver?
              </h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-name"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="checkout-name"
                  value={checkout.name}
                  onChange={(event) =>
                    updateCheckout(
                      "name",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Phone Number
                </label>
                <input
                  id="checkout-phone"
                  value={checkout.phone}
                  onChange={(event) =>
                    updateCheckout(
                      "phone",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="10-digit phone number"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-city"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  City
                </label>
                <input
                  id="checkout-city"
                  value={checkout.city}
                  onChange={(event) =>
                    updateCheckout(
                      "city",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Enter city"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-address"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Delivery Address
                </label>
                <textarea
                  id="checkout-address"
                  value={checkout.address}
                  onChange={(event) =>
                    updateCheckout(
                      "address",
                      event.target.value
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="House / Flat, street, area"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-pincode"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Pincode
                </label>
                <input
                  id="checkout-pincode"
                  value={checkout.pincode}
                  onChange={(event) =>
                    updateCheckout(
                      "pincode",
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="6-digit pincode"
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
              Payment
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Choose payment method
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: "cod" as const,
                  label: "Cash on Delivery",
                  icon: "💵",
                },
                {
                  value: "upi" as const,
                  label: "UPI",
                  icon: "📱",
                },
                {
                  value: "card" as const,
                  label: "Card",
                  icon: "💳",
                },
              ].map((method) => {
                const selected =
                  checkout.paymentMethod === method.value;

                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() =>
                      setCheckout((current) => ({
                        ...current,
                        paymentMethod:
                          method.value,
                      }))
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-200"
                    }`}
                  >
                    <div className="text-xl">
                      {method.icon}
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-900">
                      {method.label}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {selected
                        ? "Selected"
                        : "Choose this method"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {requiresPrescription && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Prescription
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Select a prescription
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                One or more products in your cart require a
                prescription. Select a prescription from your
                previous Schedula consultations.
              </p>

              {prescriptions.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    No prescription found
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Please book a consultation and obtain a
                    prescription before ordering prescription-required
                    medicines.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/doctors")
                    }
                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Find a Doctor
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {prescriptions.map((prescription) => {
                    const selected =
                      prescription.id ===
                      selectedPrescriptionId;

                    return (
                      <button
                        key={prescription.id}
                        type="button"
                        onClick={() =>
                          setSelectedPrescriptionId(
                            prescription.id
                          )
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-emerald-300 bg-white ring-4 ring-emerald-100"
                            : "border-amber-200 bg-white hover:border-emerald-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {prescription.doctorName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(
                                prescription.date
                              )}{" "}
                              ·{" "}
                              {prescription.diagnosis}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {prescription.medicineNames.map(
                                (medicineName) => (
                                  <span
                                    key={medicineName}
                                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                                  >
                                    {medicineName}
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          <span
                            className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border ${
                              selected
                                ? "border-emerald-600 bg-emerald-600 text-xs text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selected ? "✓" : ""}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!requiresPrescription && (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-sm font-bold text-emerald-900">
                No prescription required
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                The products currently in your cart can
                continue through checkout without a prescription.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              {error}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
            Order Summary
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            {cartItems.length} product
            {cartItems.length === 1 ? "" : "s"}
          </h2>

          <div className="mt-5 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-bold text-slate-900">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Subtotal
              </span>
              <span className="font-semibold text-slate-800">
                ₹{subtotal}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Delivery
              </span>
              <span className="font-semibold text-slate-800">
                {deliveryFee === 0
                  ? "Free"
                  : `₹${deliveryFee}`}
              </span>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-3">
              <span className="font-bold text-slate-900">
                Total
              </span>
              <span className="text-2xl font-extrabold text-slate-950">
                ₹{total}
              </span>
            </div>
          </div>

          {selectedPrescription && (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Prescription Selected
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {selectedPrescription.doctorName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {selectedPrescription.diagnosis}
              </p>
            </div>
          )}

          {orderPlaced && placedOrder ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-3xl">✅</div>

              <p className="mt-3 text-sm font-bold text-emerald-900">
                Order placed successfully
              </p>

              <p className="mt-1 text-sm text-emerald-800">
                Order ID: {placedOrder.id}
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                Estimated delivery:{" "}
                {formatDate(
                  placedOrder.estimatedDeliveryDate
                )}
              </p>

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push("/medical-store/orders")
                  }
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  View My Orders
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/medical-store")
                  }
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : !reviewOpen ? (
            <button
              type="button"
              onClick={handleReviewOrder}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Review Order
            </button>
          ) : (
            <div className="mt-6 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-900">
                Order details are ready for review.
              </p>

              <p className="text-xs leading-5 text-emerald-800/80">
                Delivery: {checkout.name},{" "}
                {checkout.city} - {checkout.pincode}
              </p>

              <button
                type="button"
                onClick={() =>
                  setReviewOpen(false)
                }
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Edit Details
              </button>

              <button
                type="button"
                onClick={handlePlaceOrder}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Place Order · ₹{total}
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
