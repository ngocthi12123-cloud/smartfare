/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Room {
  id: number;
  phuong: string;
  dist: number;
  area: number;
  price: number;
  lat: number;
  lng: number;
  parking: boolean;
  free: boolean;
}

export const ROOMS: Room[] = [
  { id: 1, phuong: "Phường 14, Quận 10", dist: 0.5, area: 20, price: 3800000, lat: 10.7714, lng: 106.6601, parking: true, free: true },
  { id: 2, phuong: "Phường 12, Quận 10", dist: 1.2, area: 35, price: 6200000, lat: 10.7765, lng: 106.6669, parking: true, free: true },
  { id: 3, phuong: "Phường 13, Quận 10", dist: 0.6, area: 22, price: 4500000, lat: 10.7781, lng: 106.6710, parking: true, free: false },
  { id: 4, phuong: "Phường 4, Quận 5", dist: 2.5, area: 32, price: 5500000, lat: 10.7610, lng: 106.6680, parking: true, free: true },
  { id: 5, phuong: "Phường 1, Quận 5", dist: 3.2, area: 24, price: 4100000, lat: 10.7550, lng: 106.6750, parking: false, free: true },
  { id: 6, phuong: "Phường 9, Quận 10", dist: 1.8, area: 55, price: 7200000, lat: 10.7680, lng: 106.6720, parking: true, free: true },
];

export function predictPrice(area: number, dist: number, ac: boolean, wc: boolean, pk: boolean, ft: boolean) {
  // Fuzzy weighting factors
  const wArea = area < 20 ? 1.0 : (area < 40 ? 1.2 : 1.5);
  const wDist = dist < 1.0 ? 1.3 : (dist < 2.5 ? 1.1 : 0.9);
  
  let base = 3500000 * wArea * wDist;
  
  if (ac) base += 500000;
  if (wc) base += 400000;
  if (pk) base += 200000;
  if (ft) base += 300000;
  
  const surge = dist < 1.0 ? 1.15 : 1.0;
  return { price: Math.floor(base * surge), surge };
}
