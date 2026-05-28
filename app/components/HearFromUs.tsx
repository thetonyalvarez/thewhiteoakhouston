"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function HearFromUs() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the first field when opened. Lock body scroll.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Submission failed");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Submission failed");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStatus("idle");
          setErrorMsg(null);
          setOpen(true);
        }}
        className="inline-flex items-center justify-center border border-ink text-ink hover:bg-ink hover:text-bone transition-colors duration-200 px-8 py-3 text-sm tracking-[0.2em] uppercase font-[family-name:var(--font-inter)]"
      >
        Hear From Us
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hear-from-us-title"
        >
          <div
            ref={dialogRef}
            className="bg-bone text-ink w-full max-w-md p-8 sm:p-10 shadow-2xl border border-ink/10"
          >
            <div className="flex items-start justify-between mb-6">
              <h2
                id="hear-from-us-title"
                className="font-[family-name:var(--font-fraunces)] text-3xl leading-none"
              >
                Hear from us.
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-ink/60 hover:text-ink text-2xl leading-none -mt-1"
              >
                ×
              </button>
            </div>

            {status === "success" ? (
              <div>
                <p className="text-ink/80 mb-2">Thank you.</p>
                <p className="text-ink/60 text-sm">
                  We&apos;ll be in touch from The Heights.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-8 text-sm tracking-[0.2em] uppercase border border-ink px-6 py-2 hover:bg-ink hover:text-bone transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <p className="text-ink/70 text-sm mb-4">
                  Tell us a bit about you. We&apos;ll share updates as The
                  White Oak takes shape.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    ref={firstFieldRef}
                    label="First name"
                    name="firstName"
                    required
                  />
                  <Field label="Last name" name="lastName" required />
                </div>
                <Field label="Email" name="email" type="email" required />
                <Field label="Phone" name="phone" type="tel" />

                {errorMsg && (
                  <p className="text-sm text-red-700">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full mt-4 inline-flex items-center justify-center border border-ink text-ink hover:bg-ink hover:text-bone transition-colors duration-200 px-6 py-3 text-sm tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Sending…" : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const Field = ({
  ref,
  label,
  name,
  type = "text",
  required = false,
}: {
  ref?: React.Ref<HTMLInputElement>;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) => (
  <label className="block">
    <span className="block text-xs uppercase tracking-[0.15em] text-ink/60 mb-1.5">
      {label}
      {required && <span aria-hidden> *</span>}
    </span>
    <input
      ref={ref}
      name={name}
      type={type}
      required={required}
      className="w-full bg-transparent border-b border-ink/30 focus:border-ink outline-none py-2 text-ink"
    />
  </label>
);
