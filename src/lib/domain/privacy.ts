interface HostAddress {
  addressLine: string;
  postalCode: string;
  city: string;
}

/** The exact address is shared only with the host, or with a guest whose booking is confirmed. */
export function visibleAddress(input: {
  host: HostAddress;
  viewerIsHost: boolean;
  bookingStatus: string | null;
}): string {
  const { host, viewerIsHost, bookingStatus } = input;
  const revealed = viewerIsHost || bookingStatus === "CONFIRMED" || bookingStatus === "COMPLETED";
  return revealed ? `${host.addressLine}, ${host.postalCode} ${host.city}` : host.city;
}
