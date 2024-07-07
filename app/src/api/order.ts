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

export const sendOrder = async (order: Order): Promise<ConfirmOrder> => {
  try {
    const res = await fetch("http://localhost:8080/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });
    const data = await res.json();
    return {
      ...data,
      mealImage: "data:image/image/png;base64," + data.mealImage,
    };
  } catch (error) {
    console.error(error);
    return { id: null, mealImage: "", pageUrl: "" };
  }
};

export interface IOrderStatus {
  status: string;
  message: string;
  waitingTime: string;
}

export const sendConfirmOrder = async (
  order: ConfirmOrder
): Promise<IOrderStatus> => {
  try {
    const res = await fetch("http://localhost:8080/confirmOrder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Order not confirmed",
      waitingTime: "",
    };
  }
};
