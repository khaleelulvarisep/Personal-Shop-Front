import API from "../../api/axios";

export async function generateItemsForDish(dish) {
  const response = await API.post("ai/generate-items/", { dish });
  return response?.data;
}

