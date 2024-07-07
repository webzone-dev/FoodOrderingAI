import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import TextToSpeech from "../components/TextToSpeech";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CircleIcon } from "../assets/icons";
import {
  ConfirmOrder,
  IOrderStatus,
  Order,
  sendConfirmOrder,
  sendOrder,
} from "../api/order";

enum RobotText {
  Restaurant = "Please select a restaurant.",
  Meal = "Please select a meal.",
  Order = "Is this a meal that you ordered?",
  ThanksForOrdering = "Thank you for confirming your order. Ordering now...",
  OrderSuccess = "Your order was successful.",
}

enum RobotErrorText {
  Restaurant = "Sorry, we could not find the restaurant. Please repeat desired restaurant.",
  Meal = "Sorry, we could not find the meal. Please repeat desired meal.",
  MealError = "Sorry, we could not find the meal. Please repeat desired meal.",
  OrderError = "Sorry, we could not find the order. Please repeat desired order.",
}

interface Props {
  setOrderImage: Dispatch<SetStateAction<string>>;
  setOrderStatus: Dispatch<SetStateAction<IOrderStatus | null>>;
}

export const AIFriend: React.FC<Props> = ({
  setOrderImage,
  setOrderStatus,
}) => {
  const [step, setStep] = useState<number | null>(null);
  const [robotText, setRobotText] = useState("");
  const [speechEnded, setSpeechEnded] = useState(false);
  const [order, setOrder] = useState<Order>({ restaurant: "", meal: "" });
  const [confirmOrder, setConfirmOrder] = useState<ConfirmOrder>(
    {} as ConfirmOrder
  );
  const [loading, setLoading] = useState(false);

  const { transcript, finalTranscript, resetTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    if (speechEnded) {
      setRobotText("");
      setSpeechEnded(false);

      if (step === 5) return;
      SpeechRecognition.startListening();
    }
  }, [speechEnded]);

  useEffect(() => {
    const processTranscript = async () => {
      switch (step) {
        case 1:
          if (order.restaurant) return;
          handleFirstStep();
          break;
        case 2:
          if (order.meal) return;
          await handleSecondStep();
          break;
        case 3:
          await handleThirdStep();
          break;
        case 4:
          if (!confirmOrder.pageUrl) return;
          await handleFourthStep();
          break;
        case 5:
          await handleFifthStep();
          break;
      }
      resetTranscript();
    };
    if (finalTranscript || step === 5) {
      processTranscript();
    }
  }, [step, order, finalTranscript]);

  const handleFirstStep = () => {
    setOrder({ ...order, restaurant: finalTranscript });
    handleStep(2, RobotText.Meal);
  };

  const handleSecondStep = async () => {
    setLoading(true);
    setOrder({ ...order, meal: finalTranscript });

    const { id, mealImage, pageUrl, error } = await sendOrder({
      ...order,
      meal: finalTranscript,
    });

    // If restaurant not found go back to step 1
    if (error === "Restaurant not found") {
      setOrder({ restaurant: "", meal: "" });
      handleStep(1, RobotErrorText.Restaurant);
      setLoading(false);
      return;
    }

    // If meal not found go back to step 2
    if (!id) {
      setOrder({ ...order, meal: "" });
      handleStep(2, RobotErrorText.Meal);
      setLoading(false);
      return;
    }
    setConfirmOrder({ id, pageUrl });
    handleStep(3, RobotText.Order);
    setOrderImage(mealImage!);
    setLoading(false);
  };

  const handleThirdStep = async () => {
    setOrderImage("");
    if (finalTranscript === "yes") {
      setLoading(true);
      handleStep(4, RobotText.ThanksForOrdering);
    } else {
      setOrder({ ...order, meal: "" });
      handleStep(2, RobotErrorText.MealError);
    }
  };

  const handleFourthStep = async () => {
    setLoading(true);
    setOrder({ restaurant: "", meal: "" });
    setConfirmOrder({} as ConfirmOrder);
    const orderStatus = await sendConfirmOrder(confirmOrder);

    if (orderStatus.status === "confirmed") {
      handleStep(5, RobotText.OrderSuccess);
    } else {
      handleStep(5, RobotErrorText.OrderError);
    }
    setOrderStatus(orderStatus);
    setLoading(false);
  };

  const handleFifthStep = () => {
    setOrder({ restaurant: "", meal: "" });
    setConfirmOrder({} as ConfirmOrder);
    setStep(null);

    setTimeout(() => {
      setOrderStatus(null);
    }, 3000);
  };

  const handleStep = (step: number, text: string) => {
    setRobotText(text);
    setStep(step);
  };

  const getAppropriateCircleClass = () => {
    if (robotText || loading) {
      return {
        ani: "motion-safe:animate-spin-slow",
        color: "#67e8f9",
      };
    }
    if (!robotText && step != null) {
      return {
        ani: "motion-safe:animate-scale",
        color: "#4ade80",
      };
    }
    return {
      ani: "",
      color: "#0ea5e9",
    };
  };

  return (
    <div className="flex flex-col items-center relative w-[500px]">
      <div
        onClick={() => handleStep(step ? step + 1 : 1, RobotText.Restaurant)}
        className="w-max h-max relative cursor-pointer hover:scale-105 duration-300"
      >
        <CircleIcon size={120} classes={getAppropriateCircleClass()} />
        {!step && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-lg font-semibold">
            START
          </div>
        )}
      </div>

      <div className="absolute bottom-[-20px]">
        {robotText && (
          <TextToSpeech text={robotText} setSpeechEnded={setSpeechEnded} />
        )}
        <div className="text-[#4ade80]">{transcript}</div>
      </div>
    </div>
  );
};
