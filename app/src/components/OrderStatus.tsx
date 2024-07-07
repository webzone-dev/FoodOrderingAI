import { motion } from "framer-motion";
import { IOrderStatus } from "../api/order";
import { TimeIcon } from "../assets/icons";

interface Props {
  orderStatus: IOrderStatus;
}

export const OrderStatus: React.FC<Props> = ({ orderStatus }) => {
  return (
    <motion.div
      initial={{ top: 0, opacity: 0 }}
      animate={{ top: 20, opacity: 1, transition: { duration: 0.5 } }}
      exit={{ top: 0, opacity: 0 }}
      className="absolute bg-[#333] p-3 rounded-lg shadow-lg flex justify-center items-center flex-col left-1/2 transform -translate-x-1/2 "
    >
      <div>
        {orderStatus?.status === "confirmed" || true ? (
          <>
            <span className="text-lime-500 font-semibold flex flex-col items-center">
              <span className="text-2xl ">Success</span>
              <div className="text-md ">{orderStatus?.message}</div>
            </span>
          </>
        ) : (
          <>
            <span className="text-red-500 font-semibold flex flex-col items-center">
              <span className="text-2xl ">Error</span>
              <div className="text-md ">{orderStatus?.message}</div>
            </span>
          </>
        )}
      </div>
      <br />
      <div className="text-xl font-semibold flex items-center gap-x-2">
        <TimeIcon size={24} classes={{ color: "#84cc16" }} />
        {orderStatus?.waitingTime} min
      </div>
    </motion.div>
  );
};
