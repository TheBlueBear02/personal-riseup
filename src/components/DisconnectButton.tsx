import { logout } from "@/app/actions";

export function DisconnectButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center rounded-full border border-black/10 bg-card px-4 py-2 text-sm font-medium text-text-secondary transition hover:border-black/20 hover:text-text-primary"
      >
        התנתקות
      </button>
    </form>
  );
}
