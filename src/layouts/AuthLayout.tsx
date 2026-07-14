import { Outlet, Link } from "react-router-dom";
import { Sparkles, ShieldCheck, Dna, FlaskConical } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="flex flex-col justify-between px-6 py-10 sm:px-12 lg:px-16">
        <Link
          to="/"
          className="flex w-fit items-center gap-2.5 text-lg font-bold text-ink-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Sparkles className="h-5 w-5" strokeWidth={2.25} />
          </span>
          PreGene<span className="text-brand-500">-AI</span>
        </Link>

        <div className="mx-auto w-full max-w-sm py-12">
          <Outlet />
        </div>

        <p className="text-center text-xs text-ink-300 lg:text-left">
          &copy; 2025 PreGene-AI Inc. For investigational use only.
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white">
            Precision genetic screening, built for clinicians.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-brand-100">
            Secure access to embryo analysis, reporting, and collaboration tools
            trusted by fertility clinics worldwide.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              { icon: ShieldCheck, text: "HIPAA-compliant, end-to-end encrypted" },
              { icon: Dna, text: "2,400+ genetic disorders screened" },
              { icon: FlaskConical, text: "98.7% diagnostic accuracy" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <item.icon className="h-4.5 w-4.5 text-white" />
                </span>
                <span className="text-sm font-medium text-white/90">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
