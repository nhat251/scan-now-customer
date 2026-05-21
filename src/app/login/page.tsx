import { LoginForm } from "@/components/auth/login-form";

const LoginPage = () => {
  return (
    <main className="from-background via-surface-container-low to-background flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b px-4 py-12 sm:px-6 lg:px-8">
      <LoginForm />
    </main>
  );
};

export default LoginPage;
