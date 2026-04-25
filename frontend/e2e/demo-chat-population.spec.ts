import {
  type APIResponse,
  type Browser,
  type BrowserContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

import { registerWithRetry } from "./helpers/auth";

const DEMO_PASSWORD = "pass12345";
const BACKEND_ORIGIN = "http://127.0.0.1:8000";
const AVATAR_BASE_URL = `${BACKEND_ORIGIN}/media/tmp_avatar`;
const GROUP_NAME = "Монтажная";
const GROUP_DESCRIPTION =
  "Подготовка сцен для рекламного ролика: живой чат, ответы с реплаями и активная группа.";
const PUBLIC_CHAT_TARGET = "public";
const PUBLIC_CHAT_ROUTE = "/public";

type ActorKey = "pavel" | "lada" | "mira" | "kostya" | "yura" | "izya";

type DemoActorTemplate = {
  key: ActorKey;
  baseLogin: string;
  baseHandle: string;
  displayName: string;
  bio: string;
  avatarFile: string;
};

type DemoActor = DemoActorTemplate & {
  login: string;
  handle: string;
};

type ActorSession = DemoActor & {
  page: Page;
  context: BrowserContext;
  ownedContext: boolean;
};

type SeedMessageInput = {
  key: string;
  from: ActorKey;
  text: string;
  replyTo?: string;
};

type DirectDialog = {
  resolveAs: ActorKey;
  target: ActorKey;
  messages: SeedMessageInput[];
};

type SeededMessage = {
  id: number;
  content: string;
};

type RequestFetchOptions = NonNullable<Parameters<Page["request"]["fetch"]>[1]>;
type MultipartPayload = Exclude<RequestFetchOptions["multipart"], FormData | undefined>;
type MultipartValue = MultipartPayload[string];
type MultipartFile = Exclude<MultipartValue, string | number | boolean>;

const ACTOR_TEMPLATES: DemoActorTemplate[] = [
  {
    key: "pavel",
    baseLogin: "pavelblik",
    baseHandle: "pavelblik",
    displayName: "Павел Блик",
    bio: "Собирает разговор в ритм, быстро принимает решения и держит общий план ролика.",
    avatarFile: "3857.jpg",
  },
  {
    key: "lada",
    baseLogin: "ladaiskra",
    baseHandle: "ladaiskra",
    displayName: "Лада Искра",
    bio: "Следит за визуалом, оттенками и тем, чтобы каждая сцена выглядела собранно.",
    avatarFile: "4.jpg",
  },
  {
    key: "mira",
    baseLogin: "miravolna",
    baseHandle: "miravolna",
    displayName: "Мира Волна",
    bio: "Держит легкий темп диалога и помогает сделать переписку похожей на живое общение.",
    avatarFile: "4081.webp",
  },
  {
    key: "kostya",
    baseLogin: "kostyagubka",
    baseHandle: "kostyagubka",
    displayName: "Костя Губка",
    bio: "Проверяет звук, ловит лишний шум и всегда думает, как сцена будет звучать в кадре.",
    avatarFile: "ava-stim-1.webp",
  },
  {
    key: "yura",
    baseLogin: "yurabam",
    baseHandle: "yurabam",
    displayName: "Юра Бам",
    bio: "Может подключиться в последний момент, но всегда вовремя закрывает хвосты.",
    avatarFile: "ded-bam-bam-1.webp",
  },
  {
    key: "izya",
    baseLogin: "izyapixel",
    baseHandle: "izyapixel",
    displayName: "Изя Пиксель",
    bio: "Следит, чтобы в чате все выглядело живо: аватарки читались, а реплаи не ломали ритм.",
    avatarFile: "made-these-for-my-steam-pfp-v0-p5zlum633xae1.webp",
  },
];

const DIRECT_DIALOGS: DirectDialog[] = [
  {
    resolveAs: "pavel",
    target: "lada",
    messages: [
      {
        key: "d01",
        from: "pavel",
        text: "Лада, к семи успеешь добить обложку для ролика?",
      },
      {
        key: "d02",
        from: "lada",
        text: "Да, осталось выровнять подпись и чуть приглушить фон.",
      },
      {
        key: "d03",
        from: "pavel",
        text: "Супер, тогда в группе покажи оба варианта, выберем на месте.",
      },
      {
        key: "d04",
        from: "lada",
        text: "Сделаю, сначала кину теплую версию, она живее смотрится.",
        replyTo: "d02",
      },
    ],
  },
  {
    resolveAs: "pavel",
    target: "mira",
    messages: [
      {
        key: "d05",
        from: "pavel",
        text: "Мира, сможешь первой открыть разговор в группе?",
      },
      {
        key: "d06",
        from: "mira",
        text: "Смогу, зайду с телефона и потом пересяду за ноутбук.",
      },
      {
        key: "d07",
        from: "pavel",
        text: "Тогда после входа коротко скажи, что все на месте и можно начинать.",
      },
      {
        key: "d08",
        from: "mira",
        text: "Да, это как раз покажет, что люди пишут с разных устройств.",
        replyTo: "d06",
      },
    ],
  },
  {
    resolveAs: "pavel",
    target: "kostya",
    messages: [
      {
        key: "d09",
        from: "pavel",
        text: "Костя, по звуку все чисто перед записью?",
      },
      {
        key: "d10",
        from: "kostya",
        text: "Да, микрофон ровный, клавиатуру почти не слышно и фон уже прижал.",
      },
      {
        key: "d11",
        from: "pavel",
        text: "Отлично, тогда в группе напиши это после пары сообщений, чтобы смотрелось естественно.",
        replyTo: "d09",
      },
    ],
  },
  {
    resolveAs: "pavel",
    target: "yura",
    messages: [
      {
        key: "d12",
        from: "pavel",
        text: "Юра, если немного задержишься, просто отпишись в группе, мы подхватим.",
      },
      {
        key: "d13",
        from: "yura",
        text: "Так и сделаю, максимум пять минут и я уже в чате.",
      },
      {
        key: "d14",
        from: "pavel",
        text: "Нормально, главное сразу обозначься, чтобы разговор не провис.",
        replyTo: "d12",
      },
    ],
  },
  {
    resolveAs: "pavel",
    target: "izya",
    messages: [
      {
        key: "d15",
        from: "pavel",
        text: "Изя, проследи потом, чтобы реплаи не шли подряд в лоб.",
      },
      {
        key: "d16",
        from: "izya",
        text: "Понял, разведу ответы через пару сообщений, тогда все будет смотреться живее.",
      },
      {
        key: "d17",
        from: "pavel",
        text: "И еще проверь, чтобы у всех были читаемые аватарки и имена.",
        replyTo: "d15",
      },
    ],
  },
  {
    resolveAs: "yura",
    target: "izya",
    messages: [
      {
        key: "d18",
        from: "yura",
        text: "Если я застряну в дороге, ты сможешь спокойно открыть разговор без меня?",
      },
      {
        key: "d19",
        from: "izya",
        text: "Да, начну первым и задам рабочий темп, вы потом просто подхватите.",
      },
      {
        key: "d20",
        from: "yura",
        text: "Отлично, тогда я позже отвечу тебе уже в треде, чтобы выглядело натурально.",
        replyTo: "d18",
      },
    ],
  },
];

const GROUP_DIALOG: SeedMessageInput[] = [
  {
    key: "g01",
    from: "pavel",
    text: "Коллеги, собираемся здесь в 19:30 и прогоняем сценарий ролика до финала.",
  },
  {
    key: "g02",
    from: "mira",
    text: "Я первые десять минут буду с телефона, потом пересяду за ноутбук.",
  },
  {
    key: "g03",
    from: "lada",
    text: "Обложка почти готова, осталось выбрать финальный акцентный цвет.",
  },
  {
    key: "g04",
    from: "kostya",
    text: "По звуку все чисто: микрофон ровный, фоновый шум почти не лезет.",
  },
  {
    key: "g05",
    from: "yura",
    text: "Я могу на пять минут задержаться, но в чат зайду сразу как освобожусь.",
  },
  {
    key: "g06",
    from: "izya",
    text: "Тогда скиньте еще раз порядок сцен, чтобы ничего не потерять.",
  },
  {
    key: "g07",
    from: "pavel",
    text: "Сначала быстрый вход, потом живая переписка в личке, а дальше группа с реплаями.",
  },
  {
    key: "g08",
    from: "mira",
    text: "Только давайте без случайных фраз, пусть разговор будет именно про подготовку к запуску.",
  },
  {
    key: "g09",
    from: "lada",
    text: "Я набросала пару реплик про свет, звук и тайминг, потом докину сюда еще варианты.",
  },
  {
    key: "g10",
    from: "kostya",
    text: "И ответы не кидаем сразу подряд, а пропускаем пару сообщений, так сцена выглядит живее.",
  },
  {
    key: "g11",
    from: "yura",
    text: "Мира, если зайдешь с телефона, просто кинь первое сообщение, дальше мы подхватим.",
    replyTo: "g02",
  },
  {
    key: "g12",
    from: "izya",
    text: "Ок, тогда я первым отмечусь, что все на месте и можно начинать.",
  },
  {
    key: "g13",
    from: "pavel",
    text: "Да, и в групповом блоке нужно показать, что все шестеро реально активны.",
    replyTo: "g07",
  },
  {
    key: "g14",
    from: "mira",
    text: "Мне тогда оставьте бирюзовую аву, она сразу заметна в списке участников.",
  },
  {
    key: "g15",
    from: "lada",
    text: "По обложке беру теплый оранжевый, на темном фоне он держится увереннее.",
    replyTo: "g03",
  },
  {
    key: "g16",
    from: "kostya",
    text: "Шумодав еще раз прогоню перед стартом, чтобы в кадр не пролез лишний фон.",
    replyTo: "g04",
  },
  {
    key: "g17",
    from: "yura",
    text: "Если что, вброшу реплику, что подключаюсь через две минуты и уже догоняю вас.",
  },
  {
    key: "g18",
    from: "izya",
    text: "Лада, добавь еще короткий ответ с цитатой, тогда реплай будет считываться сразу.",
    replyTo: "g09",
  },
  {
    key: "g19",
    from: "pavel",
    text: "И всем ставим нормальные аватарки, тогда чат и группа сразу будут выглядеть живыми.",
  },
  {
    key: "g20",
    from: "mira",
    text: "Согласна, пауза в пару сообщений как раз создает ощущение настоящего разговора.",
    replyTo: "g10",
  },
  {
    key: "g21",
    from: "lada",
    text: "Тогда финальный кусок диалога делаем про старт записи, без лишних шуток и в одном тоне.",
  },
  {
    key: "g22",
    from: "kostya",
    text: "Мою мемную квадратную оставьте, она даже в маленьком размере хорошо читается.",
    replyTo: "g19",
  },
  {
    key: "g23",
    from: "yura",
    text: "Да, и я сразу отмечусь, чтобы было видно, что никто не пропал и разговор идет дальше.",
    replyTo: "g17",
  },
  {
    key: "g24",
    from: "izya",
    text: "После первого сообщения я еще напомню про реплаи, чтобы никто не отвечал в лоб.",
    replyTo: "g12",
  },
  {
    key: "g25",
    from: "pavel",
    text: "Отлично, после этого запускаем запись экрана и собираем кадры для рекламного ролика.",
    replyTo: "g21",
  },
];

const PUBLIC_DIALOG: SeedMessageInput[] = [
  {
    key: "p01",
    from: "pavel",
    text: "В общем чате тоже давайте покажем живую подготовку, чтобы в ролике было видно движение.",
  },
  {
    key: "p02",
    from: "mira",
    text: "Я могу первой написать, что уже на месте и проверяю, как выглядит лента сообщений.",
  },
  {
    key: "p03",
    from: "lada",
    text: "Тогда я следом кину, что подбираю обложку и смотрю, как аватарки читаются на фоне.",
  },
  {
    key: "p04",
    from: "kostya",
    text: "А я отмечусь про звук, чтобы было видно, что в чате обсуждают реальную подготовку.",
  },
  {
    key: "p05",
    from: "yura",
    text: "Подключусь через пару минут и уже в общем чате подхвачу разговор.",
  },
  {
    key: "p06",
    from: "izya",
    text: "И я потом разнесу ответы по времени, чтобы не было ощущения постановки.",
  },
  {
    key: "p07",
    from: "pavel",
    text: "Да, главное без случайного шума: короткие, понятные сообщения и нормальный рабочий тон.",
    replyTo: "p01",
  },
  {
    key: "p08",
    from: "mira",
    text: "Тогда начну с фразы, что уже открыла чат с телефона и вижу, что все подтягиваются.",
    replyTo: "p02",
  },
  {
    key: "p09",
    from: "lada",
    text: "Я добавлю, что теплый акцент на обложке смотрится лучше и не спорит с аватарками.",
    replyTo: "p03",
  },
  {
    key: "p10",
    from: "kostya",
    text: "И следом напишу, что микрофон чистый, чтобы общий чат выглядел как настоящая координация.",
    replyTo: "p04",
  },
  {
    key: "p11",
    from: "yura",
    text: "Как зайду, отмечусь без суеты, будто просто догнал беседу после дороги.",
    replyTo: "p05",
  },
  {
    key: "p12",
    from: "izya",
    text: "Потом еще напомню про реплаи, чтобы ответы были не в лоб, а через пару сообщений.",
    replyTo: "p06",
  },
  {
    key: "p13",
    from: "pavel",
    text: "Отлично, такой общий чат уже можно спокойно показывать в рекламном ролике.",
  },
  {
    key: "p14",
    from: "mira",
    text: "Да, теперь видно, что и личка, и группа, и общий чат живые и связаны между собой.",
    replyTo: "p13",
  },
];

const RUN_SUFFIX = createRunSuffix();
const ACTORS = buildActors(RUN_SUFFIX);
const GROUP_HANDLE = appendRunSuffix("roliklab", RUN_SUFFIX);

function createRunSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function appendRunSuffix(base: string, suffix: string, maxLength = 30): string {
  const normalizedBase = base.toLowerCase();
  const safeSuffix = suffix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  const maxBaseLength = Math.max(1, maxLength - safeSuffix.length - 1);
  return `${normalizedBase.slice(0, maxBaseLength)}_${safeSuffix}`;
}

function buildActors(suffix: string): DemoActor[] {
  return ACTOR_TEMPLATES.map((actor) => ({
    ...actor,
    login: appendRunSuffix(actor.baseLogin, suffix),
    handle: appendRunSuffix(actor.baseHandle, suffix),
  }));
}

function mimeTypeFor(fileName: string): string {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (normalized.endsWith(".png")) {
    return "image/png";
  }
  if (normalized.endsWith(".webp")) {
    return "image/webp";
  }
  return "application/octet-stream";
}

function avatarUrlFor(actor: DemoActor): string {
  return `${AVATAR_BASE_URL}/${actor.avatarFile}`;
}

async function fetchAvatarFixture(
  page: Page,
  actor: DemoActor,
): Promise<MultipartFile> {
  const avatarUrl = avatarUrlFor(actor);
  const response = await page.request.get(avatarUrl);
  await expectOk(response, `load avatar fixture for ${actor.displayName}`);
  const buffer = await response.body();
  return {
    name: actor.avatarFile,
    mimeType: mimeTypeFor(actor.avatarFile),
    buffer,
  };
}

async function expectOk(response: APIResponse, action: string): Promise<void> {
  if (response.ok()) {
    return;
  }
  const body = await response.text().catch(() => "");
  throw new Error(`${action} failed: ${response.status()} ${body}`);
}

async function fetchCsrfToken(page: Page): Promise<string> {
  const response = await page.request.get("/api/auth/csrf/");
  await expectOk(response, "fetch csrf token");
  const payload = (await response.json()) as { csrfToken?: string };
  const token = String(payload.csrfToken ?? "").trim();
  if (!token) {
    throw new Error("csrf token is missing");
  }
  return token;
}

async function requestJson(
  page: Page,
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  payload?: unknown,
): Promise<APIResponse> {
  const csrfToken = await fetchCsrfToken(page);
  return page.request.fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    data: payload === undefined ? undefined : JSON.stringify(payload),
  });
}

async function requestMultipart(
  page: Page,
  url: string,
  multipart: MultipartPayload,
): Promise<APIResponse> {
  const csrfToken = await fetchCsrfToken(page);
  return page.request.fetch(url, {
    method: "PATCH",
    headers: {
      "X-CSRFToken": csrfToken,
    },
    multipart,
  });
}

async function ensureUserSession(
  browser: Browser,
  actor: DemoActor,
  providedPage?: Page,
): Promise<ActorSession> {
  const ownedContext = !providedPage;
  const context = providedPage ? providedPage.context() : await browser.newContext();
  const page = providedPage ?? (await context.newPage());

  await registerWithRetry(page, actor.login, DEMO_PASSWORD);

  const handleResponse = await requestJson(page, "PATCH", "/api/profile/handle/", {
    username: actor.handle,
  });
  await expectOk(handleResponse, `set handle for ${actor.displayName}`);

  const avatar = await fetchAvatarFixture(page, actor);
  const profileResponse = await requestMultipart(page, "/api/profile/", {
    name: actor.displayName,
    bio: actor.bio,
    image: avatar,
  });
  await expectOk(profileResponse, `update profile for ${actor.displayName}`);

  await page.goto("/devils_map_icon.svg");
  return { ...actor, page, context, ownedContext };
}

async function resolveRoomId(page: Page, target: string): Promise<number> {
  const response = await requestJson(page, "POST", "/api/chat/resolve/", { target });
  await expectOk(response, `resolve target ${target}`);
  const payload = (await response.json()) as {
    roomId?: number;
    room?: { roomId?: number };
  };
  const roomId = Number(payload.roomId ?? payload.room?.roomId ?? 0);
  if (!Number.isFinite(roomId) || roomId < 1) {
    throw new Error(`resolved target ${target} without valid roomId`);
  }
  return roomId;
}

async function createDemoGroup(page: Page): Promise<{ roomId: number; target: string }> {
  const createResponse = await requestJson(page, "POST", "/api/groups/", {
    name: GROUP_NAME,
    description: GROUP_DESCRIPTION,
    isPublic: true,
    username: GROUP_HANDLE,
  });
  await expectOk(createResponse, "create demo group");
  const payload = (await createResponse.json()) as {
    roomId: number;
    username?: string | null;
  };
  return {
    roomId: payload.roomId,
    target: `@${String(payload.username ?? GROUP_HANDLE)}`,
  };
}

async function joinGroup(page: Page, roomId: number): Promise<void> {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await requestJson(page, "POST", `/api/groups/${roomId}/join/`);
    if (response.ok()) {
      return;
    }

    const body = await response.text().catch(() => "");
    if (
      response.status() === 500 &&
      body.includes("database is locked") &&
      attempt < 4
    ) {
      await page.waitForTimeout(250 * attempt);
      continue;
    }

    throw new Error(`join group ${roomId} failed: ${response.status()} ${body}`);
  }
}

async function sendWsMessage(
  page: Page,
  roomId: number,
  content: string,
  replyToId?: number,
): Promise<SeededMessage> {
  return page.evaluate(
    async ({
      roomId,
      content,
      replyToId,
    }: {
      roomId: number;
      content: string;
      replyToId?: number;
    }) => {
      const wsUrl = `ws://127.0.0.1:8000/ws/chat/${roomId}/`;

      return new Promise<SeededMessage>((resolve, reject) => {
        const socket = new WebSocket(wsUrl);
        let settled = false;

        const timeoutId = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          socket.close();
          reject(new Error(`Timed out while sending message: ${content}`));
        }, 20_000);

        const finish = (result: SeededMessage) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          socket.close();
          resolve(result);
        };

        const fail = (message: string) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          socket.close();
          reject(new Error(message));
        };

        socket.addEventListener("open", () => {
          const payload: Record<string, unknown> = { message: content };
          if (typeof replyToId === "number") {
            payload.replyTo = replyToId;
          }
          socket.send(JSON.stringify(payload));
        });

        socket.addEventListener("message", (event) => {
          try {
            const payload = JSON.parse(String(event.data)) as {
              id?: number;
              message?: string;
              error?: string;
              replyTo?: { id?: number | null } | null;
            };

            if (payload.error) {
              fail(`chat websocket rejected message: ${payload.error}`);
              return;
            }

            if (payload.message !== content) {
              return;
            }

            if (
              typeof replyToId === "number" &&
              Number(payload.replyTo?.id ?? 0) !== replyToId
            ) {
              return;
            }

            const messageId = Number(payload.id ?? 0);
            if (!Number.isFinite(messageId) || messageId < 1) {
              fail(`chat websocket returned invalid message id for: ${content}`);
              return;
            }

            finish({ id: messageId, content });
          } catch (error) {
            fail(
              error instanceof Error
                ? error.message
                : "failed to parse websocket response",
            );
          }
        });

        socket.addEventListener("error", () => {
          fail(`chat websocket connection failed for room ${roomId}`);
        });

        socket.addEventListener("close", (event) => {
          if (settled) return;
          fail(`chat websocket closed early with code ${event.code}`);
        });
      });
    },
    { roomId, content, replyToId },
  );
}

async function sendConversation(
  actorSessions: Record<ActorKey, ActorSession>,
  roomId: number,
  messages: SeedMessageInput[],
): Promise<void> {
  const sentMessages = new Map<string, number>();

  for (const item of messages) {
    const sender = actorSessions[item.from];
    const replyToId =
      typeof item.replyTo === "string"
        ? sentMessages.get(item.replyTo)
        : undefined;

    if (item.replyTo && typeof replyToId !== "number") {
      throw new Error(`Missing reply target ${item.replyTo} for ${item.key}`);
    }

    const message = await sendWsMessage(sender.page, roomId, item.text, replyToId);
    sentMessages.set(item.key, message.id);
    await sender.page.waitForTimeout(140);
  }
}

async function seedDirectDialogs(
  actorSessions: Record<ActorKey, ActorSession>,
): Promise<void> {
  for (const dialog of DIRECT_DIALOGS) {
    const targetActor = actorSessions[dialog.target];
    const roomId = await resolveRoomId(
      actorSessions[dialog.resolveAs].page,
      `@${targetActor.handle}`,
    );
    await sendConversation(actorSessions, roomId, dialog.messages);
  }
}

async function seedGroupDialog(
  actorSessions: Record<ActorKey, ActorSession>,
  roomId: number,
): Promise<void> {
  await sendConversation(actorSessions, roomId, GROUP_DIALOG);
}

async function seedPublicDialog(
  actorSessions: Record<ActorKey, ActorSession>,
): Promise<void> {
  const publicRoomId = await resolveRoomId(
    actorSessions.pavel.page,
    PUBLIC_CHAT_TARGET,
  );
  await sendConversation(actorSessions, publicRoomId, PUBLIC_DIALOG);
}

test("creates six meaningful demo users with active direct chats, public chat, and one lively group", async ({
  page,
  browser,
}) => {
  test.setTimeout(8 * 60_000);

  const sessions: ActorSession[] = [];

  try {
    for (const [index, actor] of ACTORS.entries()) {
      const session = await ensureUserSession(
        browser,
        actor,
        index === 0 ? page : undefined,
      );
      sessions.push(session);
    }

    const actorSessions = Object.fromEntries(
      sessions.map((session) => [session.key, session]),
    ) as Record<ActorKey, ActorSession>;

    const group = await createDemoGroup(actorSessions.pavel.page);

    for (const session of sessions) {
      if (session.key === "pavel") {
        continue;
      }
      await joinGroup(session.page, group.roomId);
    }

    await seedDirectDialogs(actorSessions);
    await seedPublicDialog(actorSessions);
    await seedGroupDialog(actorSessions, group.roomId);

    await actorSessions.pavel.page.waitForTimeout(500);
    await actorSessions.pavel.page.goto("/public");

    const sidebar = actorSessions.pavel.page.getByTestId("sidebar-dm-scroll");
    await expect(sidebar).toContainText(actorSessions.lada.displayName);
    await expect(sidebar).toContainText(actorSessions.mira.displayName);
    await expect(sidebar).toContainText(actorSessions.kostya.displayName);
    await expect(sidebar).toContainText(actorSessions.yura.displayName);
    await expect(sidebar).toContainText(actorSessions.izya.displayName);
    await expect(
      actorSessions.pavel.page.getByRole("img", {
        name: actorSessions.mira.displayName,
      }).first(),
    ).toBeVisible();
    await expect(
      actorSessions.pavel.page.getByLabel(GROUP_NAME),
    ).toBeVisible();

    await actorSessions.pavel.page.goto(PUBLIC_CHAT_ROUTE);
    await expect(actorSessions.pavel.page).toHaveURL(PUBLIC_CHAT_ROUTE);
    await expect(
      actorSessions.pavel.page.getByText(PUBLIC_DIALOG[8].text).first(),
    ).toBeVisible();
    await expect(
      actorSessions.pavel.page.getByText(PUBLIC_DIALOG[13].text).first(),
    ).toBeVisible();

    await actorSessions.pavel.page.goto(`/@${actorSessions.mira.handle}`);
    await expect(
      actorSessions.pavel.page.getByText(DIRECT_DIALOGS[1].messages[1].text).first(),
    ).toBeVisible();
    await expect(
      actorSessions.pavel.page.getByText(DIRECT_DIALOGS[1].messages[3].text).first(),
    ).toBeVisible();

    await actorSessions.pavel.page.goto(`/${group.target}`);
    await expect(
      actorSessions.pavel.page.getByText(GROUP_NAME).first(),
    ).toBeVisible();
    await expect(
      actorSessions.pavel.page.getByText(GROUP_DIALOG[6].text).first(),
    ).toBeVisible();
    await expect(
      actorSessions.pavel.page.getByText(GROUP_DIALOG[24].text).first(),
    ).toBeVisible();
    await expect
      .poll(async () =>
        actorSessions.pavel.page.locator("article[data-message-id]").count(),
      )
      .toBeGreaterThanOrEqual(25);
  } finally {
    for (const session of sessions) {
      if (!session.ownedContext) {
        continue;
      }
      await session.context.close();
    }
  }
});
