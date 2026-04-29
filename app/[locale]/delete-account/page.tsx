import { notFound } from "next/navigation";
import { DeleteAccountClient } from "@/components/delete-account-client";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;

export default async function DeleteAccountPage({
  params,
}: {
  params: Params;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <DeleteAccountClient
      dict={dict.deleteAccount}
      common={{
        openAppStore: dict.common.openAppStore,
        openGooglePlay: dict.common.openGooglePlay,
      }}
    />
  );
}
