# nuqs API reference

## Import boundary

| Module                | Import from     | Use for                                        |
| --------------------- | --------------- | ---------------------------------------------- |
| Shared / server       | `nuqs/server`   | Parsers, `createLoader`, caches, serializers    |
| Client component      | `nuqs`          | `useQueryState`, `useQueryStates`, client utils |
| Shared + client hooks | both            | Parsers from `nuqs/server`, hook from `nuqs`    |

`nuqs` includes a `"use client"` directive; importing it from a module that server code loads breaks the bundle. The `nuqs` entry point also re-exports the server helpers, so client-only files may import everything from `nuqs`.

The `NuqsAdapter` is already mounted in `app/layout.tsx`; no per-page setup is needed.

## Client hooks

Use `useQueryState` for one independent key, and `useQueryStates` when several keys belong to the same feature and change together.

### `useQueryState`

```ts
const [value, setValue] = useQueryState("q", parseAsString.withDefault(""));
```

- Returns `T | null` when the parser has no default, `T` with a default.
- `setValue(null)` removes the key; `setValue(next)` serializes it.
- The setter accepts an updater and returns a Promise of the updated `URLSearchParams`.

### `useQueryStates`

```ts
const [filters, setFilters] = useQueryStates(parsers, {
  shallow: false,
  history: "replace",
});

setFilters({ status: "pending", page: 1 });
```

- Updates are batched in one event-loop tick and flushed to the URL together.
- `setFilters(null)` clears every key managed by the hook.
- Options can be set on the hook, on individual parsers, and per call.

## Parsers

| Parser                                   | Value type                       | URL form                    |
| ---------------------------------------- | -------------------------------- | --------------------------- |
| `parseAsString`                          | `string`                         | as-is                       |
| `parseAsInteger`                         | `number`                         | base-10 integer             |
| `parseAsFloat`                           | `number`                         | float                       |
| `parseAsHex`                             | `number`                         | hexadecimal                 |
| `parseAsIndex`                           | `number`                         | integer with a `+1` offset  |
| `parseAsBoolean`                         | `boolean`                        | `true` / `false`            |
| `parseAsStringLiteral(values)`           | union of `values`                | one of the literals         |
| `parseAsNumberLiteral(values)`           | union of `values`                | one of the literals         |
| `parseAsStringEnum(values)`              | enum values                      | the enum value              |
| `parseAsIsoDateTime`                     | `Date`                           | ISO 8601 datetime           |
| `parseAsIsoDate`                         | `Date`                           | ISO 8601 date               |
| `parseAsTimestamp`                       | `Date`                           | epoch milliseconds          |
| `parseAsArrayOf(parser, separator?)`     | `T[]`                            | comma-separated by default  |
| `parseAsNativeArrayOf(parser)`           | `T[]`                            | repeated `?key=` pairs      |
| `parseAsJson(schemaOrValidator)`         | inferred from the schema         | JSON-encoded                |

`parseAsJson` accepts a [Standard Schema](https://standardschema.dev) (Zod, Valibot, ArkType, Sury) or a synchronous validator that throws or returns `null` on invalid input.

## Builders

Every parser can be wrapped:

```ts
parseAsInteger.withDefault(1); // T, never null
parseAsInteger.withOptions({ history: "push", shallow: false });
parseAsInteger.withDefault(1).withOptions({ shallow: false });
```

Chain order does not matter; both return a parser.

## Options

| Option             | Default     | Meaning                                                              |
| ------------------ | ----------- | -------------------------------------------------------------------- |
| `shallow`          | `true`      | `false` re-renders the server tree (RSC, loaders) on updates          |
| `history`          | `"replace"` | `"push"` adds a history entry, enabling Back through states           |
| `scroll`           | `false`     | `true` scrolls to the top on update                                  |
| `clearOnDefault`   | `true`      | Removes the key when the value equals the default                    |
| `limitUrlUpdates`  | throttle    | `throttle(ms)`, `debounce(ms)`, or `defaultRateLimit`                |
| `startTransition`  | none        | From `useTransition`; exposes loading state with `shallow: false`    |

The returned state updates instantly even when URL writes are throttled or debounced.

`urlKeys` remaps domain names to short URL keys:

```ts
const [{ latitude, longitude }, setCoordinates] = useQueryStates(
  { latitude: parseAsFloat, longitude: parseAsFloat },
  { urlKeys: { latitude: "lat", longitude: "lng" } }
);
```

The same `urlKeys` can be passed to `createLoader`, `createSearchParamsCache`, `createSerializer`, and `createStandardSchemaV1`.

## Server helpers

### `createLoader(parsers, options?)`

```ts
const loadFilters = createLoader(parsers);
const filters = await loadFilters(searchParams);
```

Accepts a URL string, `?query` string, `URL`, `URLSearchParams`, `Request`, a record of `string | string[] | undefined`, or a Promise of any of these. Returns a Promise when given one.

Pass `{ strict: true }` at the call site to throw on invalid values instead of falling back to the default or `null`.

### `createSearchParamsCache(parsers, options?)`

For nested Server Components:

```ts
const cache = createSearchParamsCache(parsers);

// page.tsx
await cache.parse(searchParams, { strict: true });

// a child Server Component
const page = cache.get("page");
const all = cache.all();
```

Valid for the current render only. Use it when a child needs the parsed values; otherwise pass the loader result down as props.

### `createSerializer(parsers, options?)`

Builds query strings exactly as the hooks would, for `<Link href>` or redirects:

```ts
const serialize = createSerializer(parsers);

serialize({ status: "pending", page: 2 }); // ?status=pending&page=2
serialize("/invitations", { status: null, page: 1 }); // merges and removes
```

The first argument may be a path, `?query`, `URLSearchParams`, or `URL`. Accepts `urlKeys` and `processUrlSearchParams`.

### `createStandardSchemaV1(parsers, options?)`

Turns the same contract into a Standard Schema validator for API inputs:

```ts
import { createStandardSchemaV1 } from "nuqs/server";

export const validateFilters = createStandardSchemaV1(parsers);
```

Consumers implementing Standard Schema (oRPC, tRPC, TanStack Router) can use it directly. `{ partialOutput: true }` marks every key optional for routers that apply their own defaults.

## Custom parsers

Use `createParser` when no built-in fits:

```ts
const parseAsRange = createParser({
  parse(value) {
    const [min, max] = value.split("~").map(Number);
    return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null;
  },
  serialize(value) {
    return `${value.min}~${value.max}`;
  },
  eq(a, b) {
    return a.min === b.min && a.max === b.max;
  },
});
```

- `parse` returns `null` for invalid input; never throw.
- `serialize` must be deterministic and lossless.
- Provide `eq` when values are not compared correctly by `===`; `clearOnDefault` uses it.

`createMultiParser` is the equivalent for repeated keys (`?tag=a&tag=b`): `parse` and `serialize` operate on arrays.

## Source docs

- <https://nuqs.dev/docs/parsers/built-in>
- <https://nuqs.dev/docs/parsers/making-your-own>
- <https://nuqs.dev/docs/server-side>
- <https://nuqs.dev/docs/options>
- <https://nuqs.dev/docs/utilities>
- <https://nuqs.dev/playground/pagination>
- <https://github.com/47ng/nuqs/blob/next/.agents/docs/parser-implementation.md>
