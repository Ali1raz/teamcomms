"use client";

import { type MentionNodeAttrs } from "@tiptap/extension-mention";
import { type EditorView } from "@tiptap/pm/view";
import { ReactRenderer } from "@tiptap/react";
import {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { Loader2 } from "lucide-react";
import { Component } from "react";
import { UserImage } from "@/components/general/user-avatar";
import { cn } from "@/lib/utils";

/**
 * Cleanly dismisses an active suggestion (e.g. mention) by dispatching the
 * same `{ exit: true }` meta the plugin uses internally for Escape. We can't
 * use the exported `exitSuggestion` helper because the Mention extension
 * generates its own `PluginKey`, so we locate the suggestion plugin on the
 * editor instance and dispatch on its key. This avoids leaving the plugin in
 * a stuck "active" state and prevents duplicate dropdowns on the next "@".
 */
function closeSuggestion(view: EditorView) {
  const suggestionPlugin = view.state.plugins.find((plugin) => {
    const state = plugin.getState(view.state) as
      | { active?: boolean; decorationId?: string | null }
      | null
      | undefined;
    return !!state && "active" in state && "decorationId" in state;
  });

  if (suggestionPlugin) {
    view.dispatch(
      view.state.tr.setMeta(suggestionPlugin.spec.key!, { exit: true })
    );
  }
}

// Rough height of a single suggestion row + padding, used to decide whether
// the dropdown should flip above the caret when there isn't room below.
const ROW_HEIGHT = 36;

export interface MentionUser {
  id: string;
  name: string;
  email?: string;
  image?: string;
}

/**
 * Refences and Thanks to:
 *
 * https://github.com/golomb1/shadcn-tiptap-editor/blob/3d77c0c28d46a148b740e4507b035ebbf92ae0b8/src/components/ui/editor/extenstions/mentions/mentions.tsx
 *
 */

////////////////////////////////////////////////////////////////////////////////
// Suggestion list (shadcn styled dropdown)
////////////////////////////////////////////////////////////////////////////////

class MentionList extends Component<
  SuggestionProps<MentionUser, MentionNodeAttrs>
> {
  state = {
    selectedIndex: 0,
  };

  componentDidUpdate(oldProps: SuggestionProps<MentionUser, MentionNodeAttrs>) {
    if (this.props.items !== oldProps.items) {
      this.setState({ selectedIndex: 0 });
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      this.upHandler();
      return true;
    }

    if (event.key === "ArrowDown") {
      this.downHandler();
      return true;
    }

    if (event.key === "Enter") {
      this.enterHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    if (!this.props.items.length) return;
    this.setState({
      selectedIndex:
        (this.state.selectedIndex + this.props.items.length - 1) %
        this.props.items.length,
    });
  }

  downHandler() {
    if (!this.props.items.length) return;
    this.setState({
      selectedIndex: (this.state.selectedIndex + 1) % this.props.items.length,
    });
  }

  enterHandler() {
    this.selectItem(this.state.selectedIndex);
  }

  selectItem(index: number) {
    const item = this.props.items[index];
    if (item) {
      this.props.command({
        id: item.id,
        label: item.name,
      });
    }
  }

  render() {
    const { items, loading } = this.props;
    return (
      <div className="z-50 w-64 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-md">
        <p className="text-sm text-muted-foreground">Tag a member</p>
        {loading && !items.length ? (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading members…
          </div>
        ) : items.length ? (
          items.map((item, index) => (
            <button
              type="button"
              key={item.id}
              onClick={() => this.selectItem(index)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm outline-hidden",
                index === this.state.selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : ""
              )}
            >
              <UserImage
                image={item.image}
                name={item.name}
                className="size-6"
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium leading-none">
                  {item.name}
                </span>
                {item.email ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {item.email}
                  </span>
                ) : null}
              </span>
            </button>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No members found
          </div>
        )}
      </div>
    );
  }
}

export function MentionSuggestions(
  queryFunction: (query: string) => MentionUser[] | Promise<MentionUser[]>
): Omit<SuggestionOptions<MentionUser, MentionNodeAttrs>, "editor"> {
  return {
    char: "@",
    allowSpaces: false,
    debounce: 300,
    items: ({ query }) => queryFunction(query),
    render: () => {
      let component: ReactRenderer<
        MentionList,
        SuggestionProps<MentionUser, MentionNodeAttrs>
      >;
      let popup: HTMLDivElement | null = null;
      let onOutsidePointerDown: ((event: MouseEvent) => void) | null = null;

      const position = (
        props: SuggestionProps<MentionUser, MentionNodeAttrs>
      ) => {
        const rect = props.clientRect?.();
        if (!rect || !popup) return;

        const estimatedHeight =
          Math.min(props.items.length, 8) * ROW_HEIGHT + 8;
        const spaceBelow = window.innerHeight - rect.bottom;
        const flipUp =
          spaceBelow < estimatedHeight && rect.top > estimatedHeight;

        popup.style.position = "fixed";
        popup.style.left = `${rect.left}px`;
        popup.style.zIndex = "9999";

        if (flipUp) {
          popup.style.top = "auto";
          popup.style.bottom = `${window.innerHeight - rect.top + 4}px`;
        } else {
          popup.style.top = `${rect.bottom + 4}px`;
          popup.style.bottom = "auto";
        }
      };

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          if (typeof document !== "undefined") {
            popup = document.createElement("div");
            document.body.appendChild(popup);
            popup.appendChild(component.element);
            position(props);

            onOutsidePointerDown = (event: MouseEvent) => {
              const target = event.target as Node | null;
              if (!target || !(target instanceof Node)) return;
              if (popup?.contains(target)) return;
              if (props.editor.view.dom.contains(target)) return;
              closeSuggestion(props.editor.view);
            };
            document.addEventListener("mousedown", onOutsidePointerDown);
          }
        },
        onUpdate: (props) => {
          component.updateProps(props);
          position(props);
        },
        onKeyDown: ({ event, view }: SuggestionKeyDownProps) => {
          if (event.key === "Escape") {
            closeSuggestion(view);
            return true;
          }
          return component.ref?.onKeyDown(event) ?? false;
        },
        onExit: () => {
          if (onOutsidePointerDown) {
            document.removeEventListener("mousedown", onOutsidePointerDown);
            onOutsidePointerDown = null;
          }
          popup?.remove();
          popup = null;
          component?.destroy();
        },
      };
    },
  };
}
