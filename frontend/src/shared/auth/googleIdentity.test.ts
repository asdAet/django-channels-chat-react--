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

  it("prefers idToken flow when both google auth APIs are available", async () => {
    let idConfig: GoogleIdClientConfig | null = null;
    let accessTokenRequested = false;

    window.google = {
      accounts: {
        id: {
          initialize: (config) => {
            idConfig = config;
          },
          prompt: () => {
            idConfig?.callback({ credential: "id-token-123" });
          },
        },
        oauth2: {
          initTokenClient: () => ({
            requestAccessToken: () => {
              accessTokenRequested = true;
            },
          }),
        },
      },
    };

    const result = await signInWithGoogle("client-id");

    expect(result).toEqual({
      token: "id-token-123",
      tokenType: "idToken",
    });
    expect(accessTokenRequested).toBe(false);
  });

  it("falls back to accessToken when idToken flow does not return a credential", async () => {
    let idConfig: GoogleIdClientConfig | null = null;
    let oauth2Config: GoogleTokenClientConfig | null = null;

    window.google = {
      accounts: {
        id: {
          initialize: (config) => {
            idConfig = config;
          },
          prompt: () => {
            idConfig?.callback({});
          },
        },
        oauth2: {
          initTokenClient: (config) => {
            oauth2Config = config;
            return {
              requestAccessToken: () => {
                oauth2Config?.callback({ access_token: "access-token-456" });
              },
            };
          },
        },
      },
    };

    const result = await signInWithGoogle("client-id");

    expect(result).toEqual({
      token: "access-token-456",
      tokenType: "accessToken",
    });
  });
});
