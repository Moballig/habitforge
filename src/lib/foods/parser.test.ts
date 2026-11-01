import { expect, test } from "bun:test";
import { parseMealLineLocal } from "./parser";

const cases: Array<{ line: string; foods: string[] }> = [
  { line: "dupure bhat, dal, alu bhorta, dim", foods: ["Steamed rice", "Cooked dal", "Mashed potato", "Boiled egg"] },
  { line: "2 ruti, 1 dim, cha", foods: ["Wheat flatbread", "Boiled egg", "Milk tea"] },
  { line: "panta bhat, shorshe ilish", foods: ["Panta bhat", "Mustard hilsa"] },
  { line: "morog polao, borhani", foods: ["Morog polao", "Borhani"] },
  { line: "fuchka, chotpoti", foods: ["Fuchka", "Chotpoti"] },
  { line: "singara, piyaju, beguni", foods: ["Samosa/singara", "Onion fritter", "Eggplant fritter"] },
  { line: "khichuri, murgi", foods: ["Khichuri (plain)", "Chicken cooked"] },
  { line: "khashi, bhat", foods: ["Mutton (goat)", "Steamed rice"] },
  { line: "rui macher jhol, bhat", foods: ["Rui fish curry", "Steamed rice"] },
  { line: "chingri bhorta, dal", foods: ["Shrimp bhorta", "Cooked dal"] },
  { line: "chira doi, kola", foods: ["Chira with yogurt", "Banana (kola)"] },
  { line: "muri dudh, khejur", foods: ["Puffed rice with milk", "Date (khejur)"] },
  { line: "lebu sharbat, jilapi", foods: ["Lemonade", "Jilapi"] },
  { line: "dherosh bhaji, ruti", foods: ["Okra bhaji", "Wheat flatbread"] },
  { line: "lau chingri, bhat", foods: ["Bottle gourd with shrimp", "Steamed rice"] },
  { line: "mug dal ranna, alu bhorta", foods: ["Cooked moong dal", "Mashed potato"] },
  { line: "ভাত, ডাল, ডিম", foods: ["Steamed rice", "Cooked dal", "Boiled egg"] },
  { line: "পান্তা ভাত, সরিষা ইলিশ", foods: ["Panta bhat", "Mustard hilsa"] },
  { line: "দুইটা রুটি আর একটা ডিম", foods: ["Wheat flatbread", "Boiled egg"] },
  { line: "1 plate kacchi, borhani", foods: ["Mutton kacchi biriyani", "Borhani"] },
];

for (const { line, foods } of cases) {
  test(`parses: ${line}`, () => {
    expect(parseMealLineLocal(line).map((item) => item.food.nameEn)).toEqual(foods);
  });
}

test("extracts quantities and household units", () => {
  const [ruti, dim] = parseMealLineLocal("2 ruti ar 1 piece dim");
  expect(ruti.quantity).toBe(2);
  expect(dim.quantity).toBe(1);
  expect(dim.unit).toBe("piece");
});
