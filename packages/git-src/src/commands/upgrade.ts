import { upgradeSelf as doUpgrade } from "@builden/bd-utils";

export async function upgradeSelf(): Promise<void> {
  await doUpgrade();
}
