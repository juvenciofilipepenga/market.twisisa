import { useLocale } from "@/i18n/LocaleContext";
import type { OrderStatus } from "@/lib/types";
import { orderStatusLabel, orderStatusTone } from "@/lib/orderStatus";
import { Badge } from "../ui/Badge";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { locale } = useLocale();
  return <Badge tone={orderStatusTone[status]}>{orderStatusLabel[locale][status]}</Badge>;
}
