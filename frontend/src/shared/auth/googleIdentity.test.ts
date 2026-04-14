import { afterEach, describe, expect, it } from "vitest";

import { signInWithGoogle } from "./googleIdentity";

type GoogleIdClientConfig = {
  callback: (response: { credential?: string }) => void;
};

type GoogleTokenClientConfig = {
  callback: (response: { access_token?: string; error?: string }) => void;
};

describe("googleIdentity", () => {
  afterEach(() => {
    delete window.google;
  });

  it("prefers accessToken flow when both google auth APIs are available", async () => {
    let idInitialized = false;
    let oauth2Config: GoogleTokenClientConfig | null = null;

    window.google = {
      accounts: {
        id: {
          initialize: () => {
            idInitialized = true;
          },
          prompt: () => undefined,
        },
        oauth2: {
          initTokenClient: (config) => {
            oauth2Config = config;
            return {
              requestAccessToken: () => {
                oauth2Config?.callback({ access_token: "access-token-123" });
              },
            };
          },
        },
      },
    };

    const result = await signInWithGoogle("client-id");

    expect(result).toEqual({
      token: "access-token-123",
      tokenType: "accessToken",
    });
    expect(idInitialized).toBe(false);
  });

  it("falls back to idToken when oauth2 flow is unavailable", async () => {
    let idConfig: GoogleIdClientConfig | null = null;

    window.google = {
      accounts: {
        id: {
          initialize: (config) => {
            idConfig = config;
          },
          prompt: () => {
            idConfig?.callback({ credential: "id-token-456" });
          },
        },
        oauth2: undefined,
      },
    };

    const result = await signInWithGoogle("client-id");

    expect(result).toEqual({
      token: "id-token-456",
      tokenType: "idToken",
    });
  });

  it("uses popup-closed error from accessToken flow without switching back to FedCM", async () => {
    let idInitialized = false;

    window.google = {
      accounts: {
        id: {
          initialize: () => {
            idInitialized = true;
          },
          prompt: () => undefined,
        },
        oauth2: {
          initTokenClient: (config) => ({
            requestAccessToken: () => {
              config.callback({ error: "popup_closed_by_user" });
            },
          }),
        },
      },
    };

    await expect(signInWithGoogle("client-id")).rejects.toMatchObject({
      code: "oauth_popup_closed",
    });
    expect(idInitialized).toBe(false);
  });
});
