"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { PATH } from "@/constants/path";
import {
  getLoginRedirectPath,
  getLoginRedirectPathFromRole,
  mapLoginErrorMessage,
  useLoginMutation,
} from "@/hooks/mutations/useLoginMutation";
import { shouldBlockLoginAccess } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";

export const LoginForm = () => {
  const router = useRouter();
  const isAuthInitialized = useUserStore((state) => state.isAuthInitialized);
  const user = useUserStore((state) => state.user);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useLoginMutation();

  const isDisabled = useMemo(() => {
    return loginMutation.isPending || !identifier.trim() || !password.trim();
  }, [identifier, loginMutation.isPending, password]);

  useEffect(() => {
    if (!isAuthInitialized || !shouldBlockLoginAccess(user)) {
      return;
    }

    router.replace(getLoginRedirectPathFromRole(user?.role));
  }, [isAuthInitialized, router, user]);

  if (isAuthInitialized && shouldBlockLoginAccess(user)) {
    return null;
  }

  const isBootstrapping = !isAuthInitialized;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      const response = await loginMutation.mutateAsync({
        identifier: identifier.trim(),
        password,
      });

      router.replace(getLoginRedirectPath(response.result));
    } catch (error) {
      setErrorMessage(mapLoginErrorMessage(error));
    }
  };

  return (
    <div className="bg-card mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border px-6 py-8 shadow-sm sm:px-8">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase">Scan Now</p>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">Use your username or email address to continue.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="identifier">Username or email</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <UserRound className="size-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="identifier"
                  autoComplete="username"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
              </InputGroup>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>
                    <LockKeyhole className="size-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>Password is never stored outside the secure access token flow.</FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>

        <FieldError errors={errorMessage ? [{ message: errorMessage }] : undefined} />

        <Button className="w-full" disabled={isDisabled || isBootstrapping} type="submit">
          {isBootstrapping ? "Checking session..." : loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className={cn("text-muted-foreground text-center text-sm")}>Protected dashboards will redirect automatically after login.</div>
      <Button asChild className="w-full" variant="ghost">
        <Link href={PATH.home}>Back to home</Link>
      </Button>
    </div>
  );
};
