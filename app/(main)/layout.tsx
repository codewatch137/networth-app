import AppLayout from "@/components/shared/AppLayout";
import { FieldConfigProvider } from "@/lib/fieldConfigContext";
import { UserProvider } from "@/lib/userContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <FieldConfigProvider>
        <AppLayout>{children}</AppLayout>
      </FieldConfigProvider>
    </UserProvider>
  );
}
