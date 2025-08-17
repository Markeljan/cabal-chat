"use client";

import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import type { ReactNode } from "react";
import { base } from "wagmi/chains";

export function Providers(props: { children: ReactNode }) {
  return (
    <MiniKitProvider
      chain={base}
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      projectId={process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_ID}
      config={{
        appearance: {
          mode: "auto",
          theme: "base",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      {props.children}
    </MiniKitProvider>
  );
}
