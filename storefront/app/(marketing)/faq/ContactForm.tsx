"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Field } from "@/components/ui";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (sent)
    return (
      <div className="mt-6 flex items-center gap-3 rounded-lg bg-success/10 p-4 text-success" role="status">
        <CheckCircle2 className="h-5 w-5" /> Thanks — your message is in. We&apos;ll be in touch soon.
      </div>
    );

  return (
    <form
      noValidate
      className="mt-6 grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const errs: Record<string, string> = {};
        if (!String(f.get("name")).trim()) errs.name = "Please add your name.";
        if (!/^\S+@\S+\.\S+$/.test(String(f.get("email")))) errs.email = "Enter a valid email address.";
        if (String(f.get("message")).trim().length < 10) errs.message = "A little more detail, please (10+ characters).";
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setLoading(true);
        setTimeout(() => setSent(true), 700);
      }}
    >
      <Field label="Name" name="name" error={errors.name} autoComplete="name" />
      <Field label="Email" name="email" type="email" error={errors.email} autoComplete="email" />
      <div className="sm:col-span-2">
        <label htmlFor="message" className="mb-1 block text-sm font-medium">Message</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          aria-invalid={!!errors.message || undefined}
          className="w-full rounded-md border border-border-input/60 bg-bg p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
        />
        {errors.message && <p className="mt-1 text-xs text-danger">{errors.message}</p>}
      </div>
      <p className="text-xs text-muted sm:col-span-2">By sending this you agree we can reply to you by email.</p>
      <div>
        <Button type="submit" loading={loading}>Send message</Button>
      </div>
    </form>
  );
}
