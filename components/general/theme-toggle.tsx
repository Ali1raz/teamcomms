"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({
  children,
  align,
  submenu = false,
}: {
  children?: React.ReactNode;
  align?: "start" | "end" | "center";
  submenu?: boolean;
}) {
  const { setTheme } = useTheme();

  const themeItems = (
    <>
      <DropdownMenuItem onClick={() => setTheme("light")}>
        Light
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")}>
        System
      </DropdownMenuItem>
    </>
  );

  // The submenu presentation lets parent menus keep one navigation context while
  // this component remains the single owner of theme updates.
  if (submenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>{children ?? "Theme"}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>{themeItems}</DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button variant="outline" size="icon">
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align ?? "end"}>
        {themeItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
