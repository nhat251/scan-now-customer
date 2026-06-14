"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
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
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useLoginMutation();

  const { control, register } = useForm({
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const values = useWatch({ control });
  const identifier = values.identifier ?? "";
  const password = values.password ?? "";

  const isDisabled = loginMutation.isPending || !identifier.trim() || !password.trim();

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
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden lg:flex">
        <Image
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
          alt="Không gian nhà hàng hiện đại"
          fill
          className="object-cover"
          priority
        />
        <div className="to-primary/30 absolute inset-0 bg-gradient-to-t from-black/85 via-black/35" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between px-10 py-12 text-white xl:px-16 xl:py-16">
          <div>
            <p className="text-sm font-semibold tracking-[0.35em] text-white/80 uppercase">
              ScanNow
            </p>
          </div>

          <div className="max-w-xl space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight xl:text-6xl">
                Chào mừng bạn trở lại!
              </h1>
              <p className="max-w-lg text-lg text-white/90 xl:text-xl">
                Quản lý gọi món và vận hành nhà hàng trên cùng một nền tảng. Đăng nhập để quản lý
                chi nhánh, nhân sự và quy trình phục vụ.
              </p>
            </div>

            <div className="flex max-w-md items-start gap-4 rounded-2xl border border-white/20 bg-white/15 p-5 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] text-white/70 uppercase">
                  Tính năng mới
                </p>
                <p className="mt-1 text-base font-semibold">
                  Quản lý tài khoản chi nhánh nhanh hơn với phân quyền theo vai trò.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <p className="text-muted-foreground text-sm font-semibold tracking-[0.24em] uppercase lg:hidden">
              ScanNow
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">Đăng nhập</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Nhập thông tin tài khoản để tiếp tục.
            </p>
          </div>

          {errorMessage ? (
            <div className="bg-destructive/10 text-destructive border-destructive/20 mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
              <span className="font-semibold">Lỗi:</span>
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="identifier" required>
                  Tên đăng nhập hoặc email
                </FieldLabel>
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
                      placeholder="Nhập tên đăng nhập hoặc email"
                      className="h-12"
                      {...register("identifier")}
                    />
                  </InputGroup>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="password" required>
                  Mật khẩu
                </FieldLabel>
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
                      placeholder="Nhập mật khẩu"
                      className="h-12"
                      {...register("password")}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    Mật khẩu được bảo vệ bằng cơ chế xác thực an toàn.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="text-muted-foreground flex items-center gap-2">
                <input
                  type="checkbox"
                  className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
                  {...register("rememberMe")}
                />
                Ghi nhớ đăng nhập
              </label>
              <span className="text-primary font-medium">Quên mật khẩu?</span>
            </div>

            <FieldError errors={errorMessage ? [{ message: errorMessage }] : undefined} />

            <Button
              className="h-12 w-full text-base font-semibold"
              disabled={isDisabled || isBootstrapping}
              type="submit"
            >
              {isBootstrapping
                ? "Đang kiểm tra phiên..."
                : loginMutation.isPending
                  ? "Đang đăng nhập..."
                  : "Đăng nhập"}
            </Button>
          </form>

          <div className={cn("text-muted-foreground mt-10 border-t pt-8 text-center text-sm")}>
            Cần được cấp quyền?{" "}
            <span className="text-primary font-semibold">Liên hệ quản trị viên</span>
          </div>
          <Button asChild className="mt-4 w-full" variant="ghost">
            <Link href={PATH.home}>Về trang chủ</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};
