import fastify from "fastify";
import { createOrder, orderFood } from "./service/createOrder";
import cors from "@fastify/cors";
import { ConfirmOrder, Order } from "./types";
import "dotenv/config";

const server = fastify();

server.register(cors, {
  origin: "*",
});

server.post("/order", async (request, reply) => {
  const order = request.body as Order;
  const confirmOrder = await createOrder(order);
  reply.send(confirmOrder);
});

server.post("/confirmOrder", async (request, reply) => {
  const order = request.body as ConfirmOrder;
  const orderStatus = await orderFood(order);
  reply.send(orderStatus);
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
