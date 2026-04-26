import { Button } from "../shared/ui";
import styles from "../styles/pages/HomePage.module.css";

const benefits = [
  {
    title: "Публичный чат видно без аккаунта",
    text: "Новый человек может сразу открыть общий чат и понять, что происходит. Авторизация нужна только когда он решит написать сам.",
  },
  {
    title: "Действия с сообщением под рукой",
    text: "На сообщение можно быстро ответить, скопировать текст, поставить реакцию или открыть профиль автора, не перегружая сам чат лишними кнопками.",
  },
  {
    title: "Личные и группы разделены",
    text: "Личные чаты не смешиваются с группами. Доступы, файлы и реакции остаются внутри нужной переписки.",
  },
];

const footerColumns = [
  {
    title: "Продукт",
    links: [
      { label: "Публичный чат", href: "/public" },
      { label: "Войти", href: "/login" },
    ],
  },
  {
    title: "Контакты",
    links: [
      { label: "Telegram", href: "https://t.me/methoddpp", external: true },
      { label: "GitHub", href: "https://github.com/asdAet", external: true },
    ],
  },
  {
    title: "Проект",
    links: [
      {
        label: "GitHub репозиторий",
        href: "https://github.com/asdAet/Devil",
        external: true,
      },
      {
        label: "Сообщить об ошибке",
        href: "https://github.com/asdAet/Devil/issues",
        external: true,
      },
    ],
  },
] as const;

const currentYear = new Date().getFullYear();

type Props = {
  onNavigate: (path: string) => void;
  onLoginNavigate?: () => void;
};

export function HomePage({ onNavigate, onLoginNavigate }: Props) {
  const handleLoginNavigate = onLoginNavigate ?? (() => onNavigate("/login"));

  return (
    <main className={styles.home}>
      <header className={styles.promoNav}>
        <div className={styles.brand}>
          <img
            src="/MINI-direct-logo-avatar.png"
            alt=""
            loading="eager"
            decoding="async"
          />
          <span>Devil</span>
        </div>

        <nav className={styles.navLinks} aria-label="Главная навигация">
          <a href="#about">О Devil</a>
          <a href="#benefits">Что умеет</a>
          <a href="#contacts">Контакты</a>
          <a href="/public">Публичный чат</a>
        </nav>

        <Button
          variant="ghost"
          className={styles.navLogin}
          onClick={handleLoginNavigate}
        >
          Войти
        </Button>
      </header>

      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroContent}>
          <p className={styles.sectionKicker}>Публичный чат, личные и группы</p>
          <h1 id="home-title" className={styles.heroTitle}>
            Devil
          </h1>
          <p className={styles.heroLead}>
            Откройте общий чат без аккаунта, а после входа пишите в личные и
            группы, отправляйте файлы, реакции и смотрите картинки с удобным
            приближением.
          </p>
          <div className={styles.heroActions}>
            <Button
              variant="primary"
              className={styles.primaryAction}
              onClick={handleLoginNavigate}
            >
              Войти в Devil
            </Button>
          </div>
        </div>

        <div className={styles.productShowcase} aria-hidden="true">
          <div className={styles.serverRail}>
            <span className={styles.serverLogo}>
              <img src="/MINI-direct-logo-avatar.png" alt="" />
            </span>
            <span />
            <span />
            <span />
          </div>

          <div className={styles.channelPanel}>
            <strong>Devil</strong>
            <span>Общий чат без входа</span>
            <span>Группа команды</span>
            <span>Личные чаты</span>
            <span>Файлы, фото и реакции</span>
          </div>

          <div className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <strong>Публичный чат</strong>
              <span>18 участников в сети</span>
            </div>
            <div className={styles.messageList}>
              <span className={styles.messageIncoming}>
                Камилла отправила фото и реакцию
              </span>
              <span className={styles.messageOutgoing}>
                Открыл с телефона, приближение работает
              </span>
              <span className={styles.messageIncoming}>
                Доступ в группе уже обновлен
              </span>
            </div>
            <div className={styles.previewComposer}>
              <span>Сообщение...</span>
              <strong>Отправить</strong>
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className={styles.aboutSection}
        aria-labelledby="about-title"
      >
        <div className={styles.aboutLogo} aria-hidden="true">
          <img src="/MINI-direct-logo-avatar.png" alt="" loading="lazy" />
        </div>
        <div className={styles.aboutCopy}>
          <p className={styles.sectionKicker}>О продукте</p>
          <h2 id="about-title">Чат, который можно сразу показать людям</h2>
          <p className={styles.aboutText}>
            Devil подходит для открытого общения и закрытых переписок: гостям
            можно дать ссылку на публичный чат, а после входа доступны личные,
            группы, файлы, реакции и аккуратный просмотр картинок на телефоне.
          </p>
          <div
            id="benefits"
            className={styles.benefitGrid}
            aria-labelledby="benefits-title"
          >
            <h3 id="benefits-title" className={styles.benefitsTitle}>
              Что умеет Devil
            </h3>
            {benefits.map((item) => (
              <article className={styles.benefitCard} key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer
        id="contacts"
        className={styles.homeFooter}
        aria-labelledby="footer-title"
      >
        <h2 id="footer-title" className={styles.footerTitle}>
          Контакты и информация
        </h2>

        <nav className={styles.footerColumns} aria-label="Ссылки футера">
          {footerColumns.map((column) => (
            <section className={styles.footerColumn} key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    <a
                      className={styles.footerColumnLink}
                      href={link.href}
                      target={"external" in link ? "_blank" : undefined}
                      rel={"external" in link ? "noreferrer" : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <div className={styles.footerMeta}>
          <span>© {currentYear} Devil</span>
        </div>
      </footer>
    </main>
  );
}
