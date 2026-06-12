import L from 'leaflet';

// Marker đỏ theo theme (SVG inline)
const pinSvg = (color) =>
  `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path fill="${color}" stroke="#fff" stroke-width="1.5" d="M16 1C8.27 1 2 7.27 2 15c0 10.5 14 26 14 26s14-15.5 14-26C30 7.27 23.73 1 16 1z"/><circle cx="16" cy="15" r="5.5" fill="#fff"/></svg>`
  )}`;

export const redPin = new L.Icon({
  iconUrl: pinSvg('#cd3033'),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -40],
});

export const greenPin = new L.Icon({
  iconUrl: pinSvg('#059669'),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -40],
});

export const bluePin = new L.Icon({
  iconUrl: pinSvg('#2563eb'),
  iconSize: [28, 37],
  iconAnchor: [14, 37],
  popupAnchor: [0, -34],
});

export function pinForType(type) {
  return type === 'LOST' ? redPin : greenPin;
}
