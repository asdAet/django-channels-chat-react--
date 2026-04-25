import { Button } from "../shared/ui";
import styles from "../styles/pages/HomePage.module.css";

const benefits = [
  {
    title: "Чаты без лишнего шума",
    text: "Личные диалоги, группы, вложения и реакции собраны в одном привычном интерфейсе.",
  },
  {
    title: "Realtime с контролем",
    text: "Сообщения, presence и статусы чтения приходят сразу, а права и роли проверяются на сервере.",
  },
  {
    title: "Готово для телефона",
    text: "Адаптивная оболочка и composer рассчитаны на ежедневное общение с клавиатуры.",
  },
];

const steps = [
  "Войдите или создайте аккаунт",
  "Откройте публичный чат или группу",
  "Общайтесь, отправляйте файлы и управляйте доступом",
];

type Props = {
  onNavigate: (path: string) => void;
  onLoginNavigate?: () => void;
};

export function HomePage({ onNavigate, onLoginNavigate }: Props) {
  const handleLoginNavigate = onLoginNavigate ?? (() => onNavigate("/login"));

  return (
    <main className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
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

          <nav className={styles.navLinks} aria-label="Промо">
            <a href="#about">О Devil</a>
            <a href="#benefits">Преимущества</a>
            <a href="#start">Старт</a>
            <a href="/public">Публичный Чат</a>
          </nav>

          <Button
            variant="ghost"
            className={styles.navLogin}
            onClick={handleLoginNavigate}
          >
            Войти
          </Button>
        </header>

        <div className={styles.heroContent}>
          {/* <p className={styles.eyebrow}>slowed.sbs</p> */}
          <h1 id="home-title" className={styles.heroTitle}>
            Чат для своих, где все рядом
          </h1>
          <p className={styles.heroLead}>
            Devil собирает личные сообщения, группы, файлы и realtime-статусы в
            одном темном пространстве для ежедневного общения.
          </p>
          <div className={styles.heroActions}>
            <Button
              variant="primary"
              className={styles.primaryAction}
              onClick={handleLoginNavigate}
            >
              Войти в Devil
            </Button>
            <Button
              variant="ghost"
              className={styles.secondaryAction}
              onClick={() => onNavigate("/register")}
            >
              Создать аккаунт
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
            <strong>Devil Space</strong>
            <span>Публичный чат</span>
            <span>Группа проекта</span>
            <span>Личные диалоги</span>
            <span>Файлы и реакции</span>
          </div>

          <div className={styles.chatPanel}>
            <div className={styles.chatHeader}>
              <strong>Публичный чат</strong>
              <span>18 участников в сети</span>
            </div>
            <div className={styles.messageList}>
              <span className={styles.messageIncoming}>
                Камилла отправила файл и реакцию
              </span>
              <span className={styles.messageOutgoing}>
                Созвонимся позже, я закрепил сообщение
              </span>
              <span className={styles.messageIncoming}>
                Права для группы уже обновлены
              </span>
            </div>
            <div className={styles.previewComposer}>
              <span>Сообщение...</span>
              <strong>Отправить</strong>
            </div>
          </div>

          {/* <div className={styles.activityPanel}>
            <strong>Сейчас рядом</strong>
            <span>4 пишут в чате</span>
            <span>2 смотрят вложения</span>
            <span>presence online</span>
          </div> */}
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
          <p className={styles.sectionKicker}>Devil</p>
          <h2 id="about-title">Мессенджер без лишней суеты</h2>
          <p className={styles.aboutText}>
            Темная рабочая среда для общения: от публичного чата до групп и
            личных диалогов. Все важное остается рядом, а вход в приложение
            начинается прямо с этой страницы.
          </p>
          <div
            id="benefits"
            className={styles.benefitGrid}
            aria-labelledby="benefits-title"
          >
            <h3 id="benefits-title" className={styles.benefitsTitle}>
              Что дает Devil
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

      <section
        id="start"
        className={styles.startSection}
        aria-labelledby="start-title"
      >
        <div>
          <p className={styles.sectionKicker}>Старт</p>
          <h2 id="start-title">Начать можно за минуту</h2>
          <p className={styles.startText}></p>
        </div>
        <ol className={styles.stepList}>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </main>
  );
}
