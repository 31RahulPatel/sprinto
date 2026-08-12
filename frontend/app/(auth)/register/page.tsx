"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

type AccountType = "individual" | "organization";

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    setFormError(null);
    const payload = {
      ...values,
      organizationName: accountType === "organization" ? values.organizationName : undefined,
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.message ?? "Something went wrong. Please try again.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-aws-navy px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-aws-blue text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Get started with the Compliance Platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType("individual")}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  accountType === "individual"
                    ? "border-aws-blue bg-aws-blue/10 text-aws-blue"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setAccountType("organization")}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  accountType === "organization"
                    ? "border-aws-blue bg-aws-blue/10 text-aws-blue"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                Organization
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full name
                </label>
                <Input id="name" autoComplete="name" {...register("name")} />
                {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
              </div>

              {accountType === "organization" && (
                <div className="space-y-2">
                  <label htmlFor="organizationName" className="text-sm font-medium">
                    Organization name
                  </label>
                  <Input
                    id="organizationName"
                    placeholder="Acme Corp"
                    {...register("organizationName")}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
                )}
              </div>

              {formError && <p className="text-sm text-danger">{formError}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-aws-blue hover:brightness-110"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-aws-blue hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
