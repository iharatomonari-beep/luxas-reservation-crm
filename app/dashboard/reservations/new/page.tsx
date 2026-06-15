import { ReservationCreatePage } from "@/features/reservations/reservation-create-page";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function NewReservationPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = (await searchParams) ?? {};

  // CTI（アロハND5/CTIエンジン）の着信番号は ?tel= で受ける（無ければ ?phone=）。顧客名は ?name=（T043）。
  const tel = firstValue(resolvedSearchParams.tel) || firstValue(resolvedSearchParams.phone);

  return (
    <ReservationCreatePage
      initialPrefill={{
        staffId: firstValue(resolvedSearchParams.staffId),
        roomId: firstValue(resolvedSearchParams.roomId),
        date: firstValue(resolvedSearchParams.date),
        startTime: firstValue(resolvedSearchParams.startTime),
        serviceMenuId: firstValue(resolvedSearchParams.serviceMenuId),
        customerName: firstValue(resolvedSearchParams.name),
        phone: tel.trim()
      }}
    />
  );
}
