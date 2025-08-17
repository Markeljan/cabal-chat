"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface XMTPInfoCardProps {
  isOpen: boolean;
  onContinue: () => void;
}

export function XMTPInfoCard({ isOpen, onContinue }: XMTPInfoCardProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--app-background)] rounded-lg p-6 max-w-sm w-full shadow-lg border border-[var(--app-gray)]">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[var(--app-accent)] rounded-full flex items-center justify-center">
              <ArrowRight className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--app-foreground)]">
              Enable XMTP Messaging
            </h3>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-[var(--app-text-muted)] text-sm">
            To enable secure messaging, you need to sign a message that will
            create your XMTP identity. This is a one-time setup.
          </p>

          <div className="bg-[var(--app-gray)] rounded-md p-3">
            <h4 className="font-medium text-[var(--app-foreground)] mb-2 text-sm">
              What happens next:
            </h4>
            <ul className="space-y-1 text-xs text-[var(--app-text-muted)]">
              <li>• A signature popup will appear</li>
              <li>• This creates your XMTP messaging identity</li>
              <li>• No transaction fees required</li>
              <li>• Your privacy is protected</li>
            </ul>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            size="sm"
            onClick={onContinue}
            className="flex-1 bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)]"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
