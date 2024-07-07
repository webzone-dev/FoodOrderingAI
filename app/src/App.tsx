import { AnimatePresence } from "framer-motion";
import { AIFriend } from "./components/AiFriend";
import { motion } from "framer-motion";
import { useState } from "react";
import { IOrderStatus } from "./api/order";
import { OrderStatus } from "./components/OrderStatus";
function App() {
  const [orderImage, setOrderImage] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<IOrderStatus | null>(null);

  return (
    <div className="w-full h-full relative flex justify-center items-center p-3">
      <div className="flex flex-col gap-y-5 items-center">
        <AnimatePresence>
          {orderImage && (
            <motion.img
              initial={{ top: 0, opacity: 0 }}
              animate={{ top: 20, opacity: 1, transition: { duration: 0.5 } }}
              exit={{ top: 0, opacity: 0 }}
              src={orderImage}
              alt="order"
              className="absolute w-[400px] h-[150px] left-1/2 transform -translate-x-1/2 "
            />
          )}

          {orderStatus && <OrderStatus orderStatus={orderStatus} />}
        </AnimatePresence>
      </div>
      <AIFriend setOrderImage={setOrderImage} setOrderStatus={setOrderStatus} />
    </div>
  );
}

export default App;
