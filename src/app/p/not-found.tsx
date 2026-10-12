import { AppNotFound } from "@/components/layout/app-not-found";

export default function PublicProgramNotFound() {
  return (
    <AppNotFound
      title="Программы нет"
      description="Такой программы в каталоге нет. Выбери другую на главной."
      homeHref="/"
      homeLabel="На главную"
    />
  );
}
