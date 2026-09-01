import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f2faf7] via-white to-[#e7f7f1] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2">
          {/* Left Side */}
          <section className="relative overflow-hidden bg-emerald-700 px-8 py-10 text-white sm:px-12 lg:min-h-[650px] lg:px-14">
            {/* Background decoration */}
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full border border-emerald-400/20" />
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border border-emerald-400/20" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-emerald-800/40" />

            <div className="relative flex h-full flex-col">
              {/* Logo */}
              <Link href="/" className="flex w-fit items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl bg-white text-xl font-bold text-emerald-700">
                  S
                </div>

                <div>
                  <p className="text-xl font-bold">Schedula</p>

                  <p className="text-sm text-emerald-50">
                    Healthcare made simple
                  </p>
                </div>
              </Link>

              {/* Main Message */}
              <div className="mt-20 lg:mt-24">
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-50">
                  Welcome
                </p>

                <div className="mt-2 h-1 w-10 rounded-full bg-emerald-300" />

                <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight sm:text-5xl">
                  Healthcare made simple for everyone.
                </h1>

                <p className="mt-6 max-w-md text-base leading-7 text-emerald-50 sm:text-lg">
                  Choose how you want to access Schedula and continue to your
                  account.
                </p>
              </div>

              {/* Bottom Features */}
              <div className="mt-auto hidden pt-12 sm:block">
                <div className="flex items-center gap-6 text-sm text-emerald-50">
                  <span>✓ Simple</span>

                  <span className="h-5 w-px bg-emerald-400/50" />

                  <span>◷ Convenient</span>

                  <span className="h-5 w-px bg-emerald-400/50" />

                  <span>● Connected</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Side */}
          <section className="px-7 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            {/* Back */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              <span className="text-lg">←</span>
              Back to Schedula
            </Link>

            {/* Heading */}
            <div className="mt-10">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Welcome back
              </h2>

              <p className="mt-2 text-base text-slate-500">
                How would you like to login?
              </p>
            </div>

            {/* Login Options */}
            <div className="mt-8 space-y-4">
              {/* Patient Login */}
              <Link
                href="/login/patient"
                className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-emerald-100 text-2xl text-emerald-700">
                  ●
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Patient Login
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Find doctors, book appointments and manage your bookings.
                  </p>
                </div>

                <span className="text-2xl text-emerald-600 transition group-hover:translate-x-1">
                  →
                </span>
              </Link>

              {/* Doctor Login */}
              <Link
                href="/login/doctor"
                className="group flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-emerald-100 text-2xl text-emerald-700">
                  ♡
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Doctor Login
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Manage your profile, availability and appointments.
                  </p>
                </div>

                <span className="text-2xl text-emerald-600 transition group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            {/* Register */}
            <div className="mt-9">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-sm text-slate-500">
                  Don&apos;t have an account?
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <Link
                href="/register"
                className="mx-auto mt-5 flex w-full max-w-xs items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Register
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}