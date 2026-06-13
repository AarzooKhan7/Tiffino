import ScanSuccessClient from "./ScanSuccessClient";

export default async function ScanSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ slot?: string; restaurant?: string; tokens?: string; time?: string }>;
}) {
  const params     = await searchParams;
  const slot       = params.slot ?? "meal";
  const restaurant = params.restaurant ? decodeURIComponent(params.restaurant) : "your mess";
  const tokens     = params.tokens !== undefined ? Number(params.tokens) : null;
  const time       = params.time
    ? decodeURIComponent(params.time)
    : new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const date = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata",
  });

  return (
    <ScanSuccessClient
      slot={slot}
      restaurant={restaurant}
      tokens={tokens}
      time={time}
      date={date}
    />
  );
}
