"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MedicalOrder } from "@/types/medicalOrder";

const ORDERS_STORAGE_KEY = "medicalStoreOrders";

type LoggedInPatient = {
  id: string;
  name: string;
};

const ORDER_STATUS_STEPS: Array<{
  status: Exclude<MedicalOrder["status"], "cancelled">;
  label: string;
}> = [
  { status: "placed", label: "Order Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "processing", label: "Processing" },
  { status: "out-for-delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
];

const getStatusLabel = (status: MedicalOrder["status"]) => {
  switch (status) {
    case "placed":
      return "Order Placed";
    case "confirmed":
      return "Confirmed";
    case "processing":
      return "Processing";
    case "out-for-delivery":
      return "Out for Delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const getStatusClasses = (status: MedicalOrder["status"]) => {
  switch (status) {
    case "placed":
      return "bg-blue-50 text-blue-700";
    case "confirmed":
      return "bg-emerald-50 text-emerald-700";
    case "processing":
      return "bg-amber-50 text-amber-700";
    case "out-for-delivery":
      return "bg-violet-50 text-violet-700";
    case "delivered":
      return "bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-50 text-slate-700";
  }
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getStatusStepIndex = (
  status: MedicalOrder["status"]
) => ORDER_STATUS_STEPS.findIndex((step) => step.status === status);

export default function MedicalStoreOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<MedicalOrder[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<MedicalOrder | null>(null);

  useEffect(() => {
    try {
      const storedPatient = localStorage.getItem("loggedInPatient");
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);

      if (!storedPatient || !storedOrders) {
        return;
      }

      const patient = JSON.parse(storedPatient) as LoggedInPatient;
      const parsedOrders = JSON.parse(storedOrders) as MedicalOrder[];

      const patientOrders = parsedOrders
        .filter((order) => order.patientId === patient.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

      setOrders(patientOrders);
    } catch {
      setOrders([]);
    }
  }, []);

  const totalOrders = orders.length;

  const totalSpent = useMemo(
    () => orders.reduce((total, order) => total + order.total, 0),
    [orders]
  );

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-11">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
              Schedula Health Store
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              My Orders
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your healthcare product orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/medical-store")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            Shop Now
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-11">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Orders</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {totalOrders}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Spent</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">
              ₹{totalSpent}
            </p>
          </div>
        </section>

        <section className="mt-8">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="text-5xl">📦</div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No orders yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your medicine and healthcare product orders will appear here.
              </p>
              <button
                type="button"
                onClick={() => router.push("/medical-store")}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Browse Health Store
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const currentStepIndex = getStatusStepIndex(order.status);

                return (
                  <article
                    key={order.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-slate-900">{order.id}</h2>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Total</p>
                          <p className="text-xl font-extrabold text-slate-950">
                            ₹{order.total}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    {order.status === "cancelled" ? (
                      <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                        <p className="text-sm font-bold text-red-800">Order Cancelled</p>
                        <p className="mt-1 text-xs leading-5 text-red-700">
                          This order is no longer being processed.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Order Tracking
                        </p>

                        <div className="mt-4 overflow-x-auto pb-1">
                          <div className="flex min-w-[620px] items-start">
                            {ORDER_STATUS_STEPS.map((step, index) => {
                              const completed = index <= currentStepIndex;
                              const isCurrent = index === currentStepIndex;

                              return (
                                <div
                                  key={step.status}
                                  className="flex min-w-[124px] flex-1 items-start"
                                >
                                  <div className="relative flex flex-col items-center">
                                    <div
                                      className={`grid size-9 place-items-center rounded-full border-2 text-xs font-bold ${
                                        completed
                                          ? "border-emerald-600 bg-emerald-600 text-white"
                                          : "border-slate-300 bg-white text-slate-400"
                                      }`}
                                    >
                                      {completed ? "✓" : index + 1}
                                    </div>
                                    <p
                                      className={`mt-2 text-center text-[11px] font-semibold leading-4 ${
                                        isCurrent
                                          ? "text-emerald-700"
                                          : completed
                                            ? "text-slate-700"
                                            : "text-slate-400"
                                      }`}
                                    >
                                      {step.label}
                                    </p>
                                  </div>

                                  {index < ORDER_STATUS_STEPS.length - 1 && (
                                    <div
                                      className={`mt-4 h-0.5 min-w-10 flex-1 ${
                                        index < currentStepIndex
                                          ? "bg-emerald-500"
                                          : "bg-slate-300"
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <p className="mt-4 text-xs text-slate-500">
                          Estimated delivery: {formatDate(order.estimatedDeliveryDate)}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Items
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {order.items.reduce((total, item) => total + item.quantity, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Payment
                        </p>
                        <p className="mt-1 text-sm font-semibold uppercase text-slate-700">
                          {order.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Estimated Delivery
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatDate(order.estimatedDeliveryDate)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                  Order Details
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedOrder.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Order Status
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                  <p className="text-sm text-slate-500">
                    Estimated delivery: {formatDate(selectedOrder.estimatedDeliveryDate)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Products
                </p>
                <div className="mt-3 space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Delivery Address
                </p>
                <div className="mt-3 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    {selectedOrder.deliveryAddress.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedOrder.deliveryAddress.phone}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedOrder.deliveryAddress.address}, {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Payment
                  </p>
                  <p className="mt-1 text-sm font-semibold uppercase text-slate-800">
                    {selectedOrder.paymentMethod}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedOrder.paymentStatus}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Delivery
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(selectedOrder.estimatedDeliveryDate)}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold">₹{selectedOrder.subtotal}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-500">Delivery</span>
                  <span className="font-semibold">
                    {selectedOrder.deliveryFee === 0
                      ? "Free"
                      : `₹${selectedOrder.deliveryFee}`}
                  </span>
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-extrabold">₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
