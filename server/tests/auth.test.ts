import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createAuthHandlers,
  type AuthUser,
  type UserRepository,
} from "../src/services/auth.service.js";

const secret = "local-test-secret-not-for-deployment";
function setup() {
  const rows: AuthUser[] = [];
  const repo: UserRepository = {
    findByEmail: async (email) =>
      rows.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null,
    create: async (data) => {
      const user = { id: rows.length + 1, ...data };
      rows.push(user);
      return user;
    },
  };
  return { rows, repo, handlers: createAuthHandlers(repo, () => secret) };
}
async function invoke(
  handler: (req: Request, res: Response) => Promise<Response>,
  body: unknown,
) {
  let status = 200;
  let payload: Record<string, unknown> = {};
  const res = {
    status(code: number) {
      status = code;
      return this;
    },
    json(value: Record<string, unknown>) {
      payload = value;
      return this;
    },
  } as unknown as Response;
  await handler({ body } as Request, res);
  return { status, payload };
}
test("registration normalizes identity, hashes the password and cannot choose the administrator role", async () => {
  const { rows, handlers } = setup();
  const result = await invoke(handlers.register, {
    name: "  Test Person  ",
    email: "  NEW@EXAMPLE.COM ",
    password: "a-long-test-password",
    role: "admin",
  });
  assert.equal(result.status, 201);
  assert.equal(rows[0]?.name, "Test Person");
  assert.equal(rows[0]?.email, "new@example.com");
  assert.equal(rows[0]?.role, "member");
  assert.ok(await bcrypt.compare("a-long-test-password", rows[0]!.password));
  assert.ok(!JSON.stringify(result.payload).includes(rows[0]!.password));
  assert.ok(!("password" in (result.payload.user as object)));
});
test("registration rejects malformed and oversized credentials before writing", async () => {
  for (const body of [
    null,
    {},
    { name: "A", email: "user@example.com", password: "12345678" },
    { name: "Test", email: "invalid", password: "12345678" },
    { name: "Test", email: "user@example.com", password: "short" },
    { name: "Test", email: "user@example.com", password: "🧩".repeat(20) },
  ]) {
    const { rows, handlers } = setup();
    assert.equal((await invoke(handlers.register, body)).status, 400);
    assert.equal(rows.length, 0);
  }
});
test("duplicate emails including legacy mixed-case accounts return a conflict", async () => {
  const { rows, handlers } = setup();
  rows.push({
    id: 1,
    name: "Existing",
    email: "Mixed@Example.com",
    password: "hash",
    role: "admin",
  });
  const response = await invoke(handlers.register, {
    name: "New Person",
    email: "mixed@example.com",
    password: "a-long-test-password",
  });
  assert.equal(response.status, 409);
  assert.equal(rows.length, 1);
});
test("a concurrent registration unique-constraint failure is reported as a conflict", async () => {
  const handlers = createAuthHandlers(
    {
      findByEmail: async () => null,
      create: async () => {
        throw { code: "P2002" };
      },
    },
    () => secret,
  );
  assert.equal(
    (
      await invoke(handlers.register, {
        name: "Test Person",
        email: "test@example.com",
        password: "a-long-test-password",
      })
    ).status,
    409,
  );
});
test("new accounts can log in and receive only public user fields", async () => {
  const { handlers, rows } = setup();
  await invoke(handlers.register, {
    name: "Test Person",
    email: "test@example.com",
    password: "a-long-test-password",
  });
  const result = await invoke(handlers.login, {
    email: "TEST@EXAMPLE.COM",
    password: "a-long-test-password",
  });
  assert.equal(result.status, 200);
  assert.ok(!("password" in (result.payload.user as object)));
  const token = jwt.verify(
    result.payload.token as string,
    secret,
  ) as jwt.JwtPayload;
  assert.equal(token.userId, rows[0]!.id);
  assert.equal(token.role, "member");
  assert.equal(token.exp! - token.iat!, 86400);
  assert.equal(
    (
      await invoke(handlers.login, {
        email: "test@example.com",
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await invoke(handlers.login, {
        email: "missing@example.com",
        password: "wrong",
      })
    ).status,
    401,
  );
});
test("legacy short passwords still log in and missing signing config does not issue a token", async () => {
  const { rows, repo, handlers } = setup();
  rows.push({
    id: 1,
    name: "Existing",
    email: "legacy@example.com",
    password: await bcrypt.hash("123456", 10),
    role: "admin",
  });
  assert.equal(
    (
      await invoke(handlers.login, {
        email: "legacy@example.com",
        password: "123456",
      })
    ).status,
    200,
  );
  const unavailable = await invoke(
    createAuthHandlers(repo, () => undefined).login,
    { email: "legacy@example.com", password: "123456" },
  );
  assert.equal(unavailable.status, 503);
  assert.ok(!unavailable.payload.token);
});
test("unexpected backend errors do not expose database details", async () => {
  const handlers = createAuthHandlers(
    {
      findByEmail: async () => {
        throw Error("private connection details");
      },
      create: async () => {
        throw Error("unreachable");
      },
    },
    () => secret,
  );
  const result = await invoke(handlers.register, {
    name: "Test Person",
    email: "test@example.com",
    password: "a-long-test-password",
  });
  assert.equal(result.status, 500);
  assert.ok(!JSON.stringify(result.payload).includes("private connection"));
});
