import { AppHub } from "@/components/app-hub";
import { LoginScreen } from "@/components/login-screen";
import { isRequestAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const authenticated = await isRequestAuthenticated();

  return authenticated ? <AppHub /> : <LoginScreen />;
}
