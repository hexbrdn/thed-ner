import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16 bg-void">
      <LoginForm />
    </div>
  );
}
