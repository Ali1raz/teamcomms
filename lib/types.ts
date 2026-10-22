import type { InfiniteData } from "@tanstack/react-query";
import type { ClientOutputs } from "@/lib/orpc";

export type ApiResponseType = {
  status: "error" | "success";
  message: string;
};

export type ChannelType = ClientOutputs["channel"]["list"]["channels"][number];

export type InfiniteMessages = InfiniteData<
  ClientOutputs["message"]["list"],
  string | undefined
>;
