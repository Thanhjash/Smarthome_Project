import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Kết hợp các lớp CSS
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

interface MQ2Data {
  co: number;
  smoke: number;
  lpg: number;
}

interface MQ135Data {
  co2: number;
  nh3: number;
}

// Tính toán AQI tổng thể
export function calculateAQI(mq2Data: MQ2Data, mq135Data: MQ135Data): number {
  const coAQI = calculateCOAQI(mq2Data.co);
  const smokeAQI = calculateSmokeAQI(mq2Data.smoke);
  const lpgAQI = calculateLPGAQI(mq2Data.lpg);
  const co2AQI = calculateCO2AQI(mq135Data.co2);
  const nh3AQI = calculateNH3AQI(mq135Data.nh3);

  const overallAQI = Math.max(coAQI, smokeAQI, lpgAQI, co2AQI, nh3AQI);

  return Math.min(Math.round(overallAQI), 500); // AQI tối đa là 500
}

// Tính toán AQI cho CO
function calculateCOAQI(co: number): number {
  if (co <= 4.4) return linearScale(co, 0, 4.4, 0, 50);
  if (co <= 9.4) return linearScale(co, 4.5, 9.4, 51, 100);
  if (co <= 12.4) return linearScale(co, 9.5, 12.4, 101, 150);
  if (co <= 15.4) return linearScale(co, 12.5, 15.4, 151, 200);
  if (co <= 30.4) return linearScale(co, 15.5, 30.4, 201, 300);
  if (co <= 40.4) return linearScale(co, 30.5, 40.4, 301, 400);
  return linearScale(co, 40.5, 50.4, 401, 500);
}

// Tính toán AQI cho khói (PM2.5)
function calculateSmokeAQI(smoke: number): number {
  if (smoke <= 12) return linearScale(smoke, 0, 12, 0, 50);
  if (smoke <= 35.4) return linearScale(smoke, 12.1, 35.4, 51, 100);
  if (smoke <= 55.4) return linearScale(smoke, 35.5, 55.4, 101, 150);
  if (smoke <= 150.4) return linearScale(smoke, 55.5, 150.4, 151, 200);
  if (smoke <= 250.4) return linearScale(smoke, 150.5, 250.4, 201, 300);
  if (smoke <= 350.4) return linearScale(smoke, 250.5, 350.4, 301, 400);
  return linearScale(smoke, 350.5, 500.4, 401, 500);
}

// Tính toán AQI cho LPG
function calculateLPGAQI(lpg: number): number {
  if (lpg <= 500) return linearScale(lpg, 0, 500, 0, 50);
  if (lpg <= 1000) return linearScale(lpg, 501, 1000, 51, 100);
  if (lpg <= 2000) return linearScale(lpg, 1001, 2000, 101, 150);
  if (lpg <= 5000) return linearScale(lpg, 2001, 5000, 151, 200);
  if (lpg <= 10000) return linearScale(lpg, 5001, 10000, 201, 300);
  if (lpg <= 20000) return linearScale(lpg, 10001, 20000, 301, 400);
  return linearScale(lpg, 20001, 40000, 401, 500);
}

// Tính toán AQI cho CO2
function calculateCO2AQI(co2: number): number {
  if (co2 <= 1000) return linearScale(co2, 0, 1000, 0, 50);
  if (co2 <= 2000) return linearScale(co2, 1001, 2000, 51, 100);
  if (co2 <= 5000) return linearScale(co2, 2001, 5000, 101, 150);
  if (co2 <= 10000) return linearScale(co2, 5001, 10000, 151, 200);
  if (co2 <= 20000) return linearScale(co2, 10001, 20000, 201, 300);
  if (co2 <= 40000) return linearScale(co2, 20001, 40000, 301, 400);
  return linearScale(co2, 40001, 50000, 401, 500);
}

// Tính toán AQI cho NH3
function calculateNH3AQI(nh3: number): number {
  if (nh3 <= 25) return linearScale(nh3, 0, 25, 0, 50);
  if (nh3 <= 50) return linearScale(nh3, 26, 50, 51, 100);
  if (nh3 <= 100) return linearScale(nh3, 51, 100, 101, 150);
  if (nh3 <= 200) return linearScale(nh3, 101, 200, 151, 200);
  if (nh3 <= 400) return linearScale(nh3, 201, 400, 201, 300);
  if (nh3 <= 800) return linearScale(nh3, 401, 800, 301, 400);
  return linearScale(nh3, 801, 1600, 401, 500);
}

// Hàm tiện ích để chuyển đổi giá trị
function linearScale(value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number): number {
  return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}
