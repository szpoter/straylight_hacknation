/**
 * Operator tool: prints ADMIN_PASSWORD_HASH for the password read from stdin.
 *   npm run admin:hash            (type the password, then Enter)
 *   echo -n "hasło" | npm run admin:hash
 * The password never goes into shell history or the repo; only the hash is stored in Vercel.
 */
import { createInterface } from "node:readline";
import { hashPassword } from "../src/lib/admin/auth";

const MIN_LENGTH = 12;

async function readPassword(): Promise<string> {
  if (process.stdin.isTTY) process.stderr.write("Hasło administratora: ");
  const rl = createInterface({ input: process.stdin, terminal: false });
  for await (const line of rl) {
    rl.close();
    return line;
  }
  return "";
}

async function main() {
  const password = await readPassword();
  if (password.length < MIN_LENGTH) {
    console.error(`Hasło musi mieć co najmniej ${MIN_LENGTH} znaków.`);
    process.exit(1);
  }
  console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
}

void main();
