import Link from "next/link";

const features = [
  {
    title: "Trusted Doctors",
    description: "Connect with experienced healthcare professionals.",
  },
  {
    title: "Easy Booking",
    description: "Find a doctor and book an appointment in a few clicks.",
  },
  {
    title: "Flexible Scheduling",
    description: "Choose from available dates and time slots.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-900">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
              S
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                Schedula
              </p>

              <p className="text-xs text-slate-500">
                Healthcare made simple
              </p>
            </div>
          </Link>

          {/* Patient Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              href="/appointments"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              My Appointments
            </Link>

            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Your health, our priority
          </span>

          <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Find the right doctor and book your appointment easily.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Schedula helps you discover trusted doctors, view their
            availability, and book appointments at a time that works for you.
          </p>

          {/* Main Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {/* Doctor Register */}
            <Link
              href="/doctors/register"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Doctor Register
            </Link>

            {/* Find a Doctor */}
            <Link
              href="/doctors"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
            >
              Find a Doctor
            </Link>
          </div>

          {/* Doctor Login */}
          <div className="mt-4">
            <Link
              href="/doctors/login"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Already a doctor? Login here →
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Patients can find doctors and book appointments. Doctors can
            register and manage their availability.
          </p>
        </div>

        {/* Hero Card */}
        <div className="relative">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-900/5 sm:p-7">
            <div className="rounded-2xl bg-emerald-50 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Next appointment
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    General Medicine
                  </h2>
                </div>

                <div className="grid size-12 place-items-center rounded-full bg-emerald-600 text-base font-bold text-white">
                  AR
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-white p-4 sm:p-5">
                <p className="font-semibold">
                  Dr. Anika Rao
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  General Medicine · 12 years experience
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Date
                    </p>

                    <p className="mt-1 font-semibold">
                      Tomorrow
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Time
                    </p>

                    <p className="mt-1 font-semibold">
                      10:00 AM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Consultation fee
                </p>

                <p className="text-xl font-bold">
                  ₹499
                </p>
              </div>

              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
              Why Schedula
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Healthcare booking made simple.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                  {index + 1}
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {feature.title}
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="rounded-3xl bg-emerald-700 px-6 py-11 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to take care of your health?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-emerald-50">
            Create your account and start exploring doctors and available
            appointments.
          </p>

          <Link
            href="/register"
            className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            Register Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © 2026 Schedula. All rights reserved.
          </p>

          <p>
            Healthcare appointment platform
          </p>
        </div>
      </footer>
    </main>
  );
}