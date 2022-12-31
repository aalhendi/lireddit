import argon2 from "argon2";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function makeid(length: Number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const postData: Prisma.PostCreateInput[] = [];

for (let i = 0; i < 100; ++i) {
  postData.push({
    title: makeid(Math.random() * 32),
    // Maybe randomize content
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    published: Math.random() > 0.5 ? true : false,
    author: {
      connect: {
        id: 1, // Can random this too if we make a bunch of users
      },
    },
    points: Math.round(Math.random() * 100),
  });
}

async function main() {
  console.log(`Start seeding ...`);
  const pw = await argon2.hash("bob");
  const user = await prisma.user.create({
    data: {
      email: "bob@bob.com",
      password: pw,
      name: "bobby",
    },
  });
  console.log(`Created user with id: ${user.id}`);
  for (const p of postData) {
    const post = await prisma.post.create({
      data: p,
    });
    console.log(`Created post with id: ${post.id}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
