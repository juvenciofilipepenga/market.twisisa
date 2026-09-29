// Geolocalização do browser + geocodificação inversa (Nominatim/OpenStreetMap, gratuito,
// sem chave). NOTA IMPORTANTE: o backend ainda não tem nenhum campo de morada associado a
// uma encomenda (o modelo Address existe no schema do Prisma mas nenhuma rota o usa — ver
// README). Por isso isto é só uma conveniência do lado do cliente: fica guardado no
// localStorage do dispositivo, para copiar e enviar manualmente (ex.: ao suporte por chat),
// e não é enviado para nenhuma encomenda.
export interface DetectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export function getBrowserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("REVERSE_GEOCODE_FAILED");
  const data = await res.json() as { display_name?: string };
  if (!data.display_name) throw new Error("REVERSE_GEOCODE_EMPTY");
  return data.display_name;
}

export async function detectLocation(): Promise<DetectedLocation> {
  const position = await getBrowserLocation();
  const { latitude, longitude } = position.coords;
  const address = await reverseGeocode(latitude, longitude);
  return { latitude, longitude, address };
}
