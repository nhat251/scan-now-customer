"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ShoppingBag, Utensils } from "lucide-react";

import { Logo } from "@/components/atoms/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PATH } from "@/constants/path";
import { usePlacePublicOrderMutation } from "@/hooks/mutations/useOrderMutations";
import { recalculateCart, useSharedCart } from "@/hooks/useSharedCart";
import type { PersistedCustomerSession } from "@/types/customer-session";

import {
  formatCurrency,
  persistCustomerOrder,
  readPersistedCustomerSession,
} from "./customer-session-utils";

type Props = {
  sessionCode: string;
};

export const SessionCheckoutPage = ({ sessionCode }: Props) => {
  const router = useRouter();
  const normalizedSessionCode = sessionCode.toUpperCase();
  const [session, setSession] = useState<PersistedCustomerSession | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [formError, setFormError] = useState("");
  const { cart, status: cartStatus, isUpdating, updateCart, clearCart } = useSharedCart(normalizedSessionCode);
  const placeOrderMutation = usePlacePublicOrderMutation();

  useEffect(() => {
    setSession(readPersistedCustomerSession());
  }, []);

  const totalQuantity = cart.items.reduce((total, item) => total + item.quantity, 0);
  const cannotSubmit =
    totalQuantity === 0 ||
    isUpdating ||
    placeOrderMutation.isPending ||
    cartStatus === "connecting" ||
    cartStatus === "reconnecting";

  const updateSpecialRequest = async (menuItemId: string, specialRequest: string) => {
    await updateCart(
      recalculateCart({
        ...cart,
        items: cart.items.map((item) =>
          item.menuItemId === menuItemId ? { ...item, specialRequest: specialRequest || null } : item
        ),
      })
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (cart.items.length === 0) {
      setFormError("Gio hang dang trong. Vui long chon mon truoc khi gui don.");
      return;
    }

    try {
      const response = await placeOrderMutation.mutateAsync({
        sessionCode: normalizedSessionCode,
        request: {
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          customerNote: customerNote.trim() || null,
          items: cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            note: item.specialRequest?.trim() || null,
          })),
        },
      });

      persistCustomerOrder(normalizedSessionCode, response.result.orderId);
      await clearCart();
      router.replace(PATH.customer.sessionOrder(normalizedSessionCode, response.result.orderId));
    } catch {
      setFormError("Khong the gui don luc nay. Vui long kiem tra gio hang va thu lai.");
    }
  };

  return (
    <main className="fixed inset-0 z-[60] overflow-y-auto bg-[#f8f9fa] font-sans text-gray-900">
      <div className="mx-auto min-h-full w-full max-w-md pb-32">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
          <Logo size={16} textSize="text-xl" />
          <div className="text-primary-container flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm font-bold">
            <Utensils className="size-4" />
            {session ? `Ban ${session.tableNumber}` : normalizedSessionCode}
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <section className="px-4 pt-5">
            <Button asChild variant="ghost" className="-ml-4 px-4">
              <Link href={PATH.customer.sessionMenu(normalizedSessionCode)}>
                <ArrowLeft className="size-4" />
                Quay lai menu
              </Link>
            </Button>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Xac nhan don mon</h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              {session?.branchName ?? "ScanNow"} - Ban {session?.tableNumber ?? "-"}
            </p>
          </section>

          <section className="mt-6 space-y-3 px-4">
            {cart.items.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <ShoppingBag className="mx-auto size-10 text-gray-400" />
                <h2 className="mt-3 text-lg font-bold">Gio hang dang trong</h2>
                <p className="mt-2 text-sm text-gray-500">Them mon tu menu de gui yeu cau den nhan vien.</p>
              </div>
            ) : null}

            {cart.items.map((item) => (
              <article key={item.menuItemId} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{item.menuItemName}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="text-primary-container shrink-0 font-bold">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
                <Textarea
                  value={item.specialRequest ?? ""}
                  onChange={(event) => void updateSpecialRequest(item.menuItemId, event.target.value)}
                  placeholder="Ghi chu cho mon nay (vi du: it cay, khong hanh)"
                  className="mt-3 min-h-16 resize-none rounded-xl"
                  disabled={isUpdating}
                />
              </article>
            ))}
          </section>

          <section className="mt-6 space-y-4 px-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold">Thong tin don</h2>
              <div className="mt-4 space-y-3">
                <Input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Ten khach (tuy chon)"
                  className="h-12 rounded-xl"
                />
                <Input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="So dien thoai (tuy chon)"
                  inputMode="tel"
                  className="h-12 rounded-xl"
                />
                <Textarea
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  placeholder="Ghi chu chung cho don"
                  className="min-h-20 resize-none rounded-xl"
                />
              </div>
            </div>
            {formError ? <p className="text-destructive text-sm font-semibold">{formError}</p> : null}
          </section>

          <footer className="fixed right-0 bottom-0 left-0 z-[70] border-t border-gray-100 bg-white/95 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
            <div className="mx-auto flex max-w-md items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">{totalQuantity} mon</p>
                <p className="text-primary-container text-lg font-black">{formatCurrency(cart.totalAmount)}</p>
              </div>
              <Button type="submit" className="h-12 rounded-2xl px-6" disabled={cannotSubmit}>
                {placeOrderMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Gui don
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
};
