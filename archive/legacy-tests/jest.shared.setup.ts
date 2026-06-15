import "@testing-library/jest-dom";
import "whatwg-fetch";
import dotenv from "dotenv";
import { TextDecoder, TextEncoder } from "util";

dotenv.config({ path: ".env.local" });

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

jest.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => fn(...args),
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

global.IntersectionObserver = class IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn().mockReturnValue([]);
} as unknown as typeof IntersectionObserver;

global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
} as unknown as typeof ResizeObserver;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Element.prototype.scrollIntoView = jest.fn();
Object.defineProperty(window, "scrollTo", { value: jest.fn(), writable: true });

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

jest.mock(
  "react-router-dom",
  () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");

    const Link = React.forwardRef(
      (
        {
          to,
          children,
          ...props
        }: { to: string; children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLAnchorElement>,
      ) => React.createElement("a", { href: to, ref, ...props }, children),
    );
    Link.displayName = "MockLink";

    const NavLink = React.forwardRef(
      (
        {
          to,
          children,
          className,
          ...props
        }: {
          to: string;
          children?: React.ReactNode;
          className?: string | ((opts: { isActive: boolean }) => string);
          [key: string]: unknown;
        },
        ref: React.Ref<HTMLAnchorElement>,
      ) => {
        const resolvedClassName =
          typeof className === "function" ? className({ isActive: false }) : className;
        return React.createElement(
          "a",
          { href: to, ref, className: resolvedClassName, ...props },
          children,
        );
      },
    );
    NavLink.displayName = "MockNavLink";

    return {
      Link,
      NavLink,
      useNavigate: () => jest.fn(),
      useParams: () => ({}),
      useSearchParams: () => [new URLSearchParams(), jest.fn()],
      useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
    };
  },
  { virtual: true },
);
