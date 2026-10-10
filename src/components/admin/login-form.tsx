"use client";

import { EyeIcon, EyeSlashIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField, Input, fieldProps } from "@/components/ui/form";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const expired = searchParams.has("expired");
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.error || (expired && !state.fieldErrors) ? (
        <div
          role="alert"
          className={
            state.error
              ? "flex gap-3 rounded-inner bg-danger-soft px-4 py-3 text-sm text-danger ring-1 ring-danger/20"
              : "flex gap-3 rounded-inner bg-warning-soft px-4 py-3 text-sm text-warning ring-1 ring-warning/20"
          }
        >
          <WarningCircleIcon size={20} className="shrink-0" aria-hidden="true" />
          {state.error ?? "Sesi kamu sudah berakhir. Silakan masuk kembali."}
        </div>
      ) : null}

      <FormField id="email" label="Email" error={state.fieldErrors?.email}>
        <Input
          {...fieldProps("email", state.fieldErrors?.email)}
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          defaultValue={state.email}
          placeholder="admin@heaveninv.id"
          required
        />
      </FormField>

      <FormField id="password" label="Password" error={state.fieldErrors?.password}>
        <div className="relative">
          <Input
            {...fieldProps("password", state.fieldErrors?.password)}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-control text-ink-muted hover:bg-canvas hover:text-ink"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        </div>
      </FormField>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Memeriksa..." : "Masuk"}
      </Button>
    </form>
  );
}
