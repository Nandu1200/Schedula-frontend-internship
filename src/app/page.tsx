import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f8fffc] via-white to-[#ecfaf5] text-slate-900">
      {/* Decorative Background */}
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-emerald-50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[700px] -translate-x-1/2 rounded-[50%] bg-emerald-100/40 blur-3xl" />

      {/* Small decorative dots */}
      <div className="pointer-events-none absolute left-10 top-52 hidden gap-3 sm:grid sm:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className="size-1.5 rounded-full bg-emerald-200"
          />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-48 right-10 hidden gap-3 sm:grid sm:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className="size-1.5 rounded-full bg-emerald-200"
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-8">
        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2.5 text-sm font-semibold text-emerald-700">
            <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-xs text-white">
              ✓
            </span>

            Your health, our priority
          </div>

          {/* Heading */}
          <h1 className="mt-8 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-7xl">
            Simple healthcare.
            <br />
            Easy appointments
            <span className="text-emerald-600">.</span>
          </h1>

          {/* Description */}
          <p className="mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Schedula makes it easy for patients to connect with doctors
            and manage appointments, while doctors can manage their
            profiles and availability.
          </p>

          {/* Login / Register */}
          <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-w-36 items-center justify-center rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="inline-flex min-w-36 items-center justify-center rounded-xl border border-emerald-500 bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Register
            </Link>
          </div>

          {/* Audience Cards */}
          <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
            {/* Patient */}
            <div className="rounded-2xl border border-white/80 bg-white/80 p-5 text-left shadow-lg shadow-slate-900/5 backdrop-blur-sm transition hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-xl">
                  👤
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    For Patients
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    Find doctors, view available slots and book
                    appointments.
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor */}
            <div className="rounded-2xl border border-white/80 bg-white/80 p-5 text-left shadow-lg shadow-slate-900/5 backdrop-blur-sm transition hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-xl">
                  🩺
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    For Doctors
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    Create your profile and manage your appointment
                    availability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 text-center">
          <p className="text-sm text-slate-500">
            © 2026 Schedula. Healthcare appointment platform.
          </p>
        </footer>
      </div>
    </main>
  );
}