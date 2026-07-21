"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  SITE_ACCESS_COOKIE,
  createAccessToken,
  passwordsMatch,
  siteAccessCookieOptions,
} from "@/lib/auth";
import { FINANCE_CACHE_TAG } from "@/lib/data";

export async function refreshFinanceData(): Promise<void> {
  // Expire immediately so the next render fetches fresh sheet data
  revalidateTag(FINANCE_CACHE_TAG, { expire: 0 });
  revalidatePath("/dashboard");
}

export type LoginState = { error: string } | null;

export async function loginWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const submitted = String(formData.get("password") ?? "");
  const expected = process.env.SITE_PASSWORD?.trim();

  if (!expected) {
    return { error: "סיסמת האתר לא הוגדרה בשרת" };
  }

  if (!passwordsMatch(submitted, expected)) {
    return { error: "סיסמה שגויה" };
  }

  const token = await createAccessToken();
  if (!token) {
    return { error: "סיסמת האתר לא הוגדרה בשרת" };
  }

  const jar = await cookies();
  jar.set(
    SITE_ACCESS_COOKIE,
    token,
    siteAccessCookieOptions(process.env.NODE_ENV === "production"),
  );

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.set(SITE_ACCESS_COOKIE, "", {
    ...siteAccessCookieOptions(process.env.NODE_ENV === "production"),
    maxAge: 0,
  });
  redirect("/");
}
