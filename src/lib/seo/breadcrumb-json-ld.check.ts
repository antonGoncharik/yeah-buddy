import { breadcrumbJsonLd } from "@/lib/seo/breadcrumb-json-ld";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

const ld = breadcrumbJsonLd(
  [
    { name: "Главная", path: "/" },
    { name: "Программы", path: "/p" },
    { name: "Фулбоди", path: "/p/fullbody" },
  ],
  new URL("https://yeahbuddy.example"),
);

assertEqual(ld["@type"], "BreadcrumbList", "breadcrumb type");
assertEqual(
  ld.itemListElement.map(
    (item) => `${item.position}:${item.name}:${item.item}`,
  ),
  [
    "1:Главная:https://yeahbuddy.example/",
    "2:Программы:https://yeahbuddy.example/p",
    "3:Фулбоди:https://yeahbuddy.example/p/fullbody",
  ],
  "breadcrumb items",
);

console.log("breadcrumb json-ld ok");
