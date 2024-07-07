const openAIRequest = async (body: object) => {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
};

export const fetchRestaurantAndMeal = async (orderString: string) => {
  try {
    const response = await openAIRequest({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "From following string extract restaurant and meal. Return restaurant and meal in json format. Return only json, nothing else. Example: {restaurant: 'Kitajska Vas', meal: 'Presneti piščanec'}.",
        },
        {
          role: "user",
          content: orderString,
        },
      ],
    });
    const data: any = await response.json();
    return data.choices[0].message;
  } catch (error) {
    console.error(error);
  }
};
export const fetchDesiredRestaurantOrMeal = async (
  items: string,
  searchedItem: string
) => {
  try {
    const response = await openAIRequest({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Given the list of items below, determine the ID of the item closely matching the name provided: '${searchedItem}'. Return the ID in JSON format, for example, {"id": 10}. If a matching item is not found return {"id": null}. Ensure to consider slight inaccuracies in the item name during the search.`,
        },
        {
          role: "user",
          content: items,
        },
      ],
    });

    const data: any = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(error);
  }
};
