import { ElementHandle } from "playwright";

export interface Restaurant {
  id: number;
  name: string;
  url: string;
  isOpened: boolean;
  element: ElementHandle<SVGElement | HTMLElement>;
}

export interface Meal {
  element: ElementHandle<SVGElement | HTMLElement>;
  id: number;
  name: any;
}

export interface Order {
  restaurant: string;
  meal: string;
}

export interface ConfirmOrder {
  id: number | null;
  mealImage?: string;
  pageUrl: string;
  error?: string;
}

export interface OrderStatus {
  status: string;
  message: string;
  waitingTime: string;
  error?: string;
}

export enum EOrderStatus {
  ERROR = "error",
  CONFIRMED = "confirmed",
}
