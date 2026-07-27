import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.brand} href="/" aria-label="КБ Парус — на главную">
          <Image src="/brand/logo-g.png" alt="КБ Парус" width={226} height={75} priority />
        </Link>

        <section className={styles.content} aria-labelledby="not-found-title">
          <span className={styles.eyebrow}>Навигация по сайту</span>
          <strong className={styles.code} aria-hidden="true">
            404
          </strong>
          <h1 id="not-found-title">Такой страницы нет</h1>
          <p>
            Адрес мог измениться. Вернитесь на главную или сразу перейдите к системам хранения
            металла — каталог и расчёт доступны в один клик.
          </p>

          <div className={styles.actions}>
            <Link className={styles.action} href="/#catalog">
              Открыть каталог
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link className={styles.secondary} href="/#calculator">
              <Calculator size={19} aria-hidden="true" />
              Рассчитать стоимость
            </Link>
          </div>
        </section>

        <footer className={styles.footer}>
          <strong>КБ Парус</strong>
          <span>Проектирование и производство систем хранения металла</span>
        </footer>
      </div>
    </main>
  );
}
