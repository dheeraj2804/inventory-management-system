import prisma from "../config/prisma.js";
import { createAuthHandlers } from "../services/auth.service.js";

export const { register, login } = createAuthHandlers(
  {
    // Keep existing mixed-case email accounts usable while normalizing new accounts.
    findByEmail: (email) =>
      prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      }),
    create: (data) => prisma.user.create({ data }),
  },
  () => process.env.JWT_SECRET,
);
