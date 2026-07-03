export const defaultFlightImage = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#eef3f1"/>
    <path d="M165 270h175l125-112h55l-68 112h128l42-45h38l-25 76H452l68 112h-55L340 301H165l-46 38H80l28-64-28-64h39z" fill="#7f9189"/>
    <text x="400" y="405" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#53645d">Flight image</text>
  </svg>
`);

export const flightImage = (flight, type = "thumbnail") => {
  if (!flight) return defaultFlightImage;
  if (type === "banner") return flight.flightBanner || flight.flightThumbnail || flight.airlineLogo || flight.airlineLogoUrl || defaultFlightImage;
  if (type === "logo") return flight.airlineLogo || flight.airlineLogoUrl || flight.flightThumbnail || defaultFlightImage;
  return flight.flightThumbnail || flight.flightBanner || flight.airlineLogo || flight.airlineLogoUrl || defaultFlightImage;
};
