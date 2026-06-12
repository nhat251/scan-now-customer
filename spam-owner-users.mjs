import axios from "axios";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://api.scannow.site";
const OWNER_IDENTIFIER = process.env.OWNER_IDENTIFIER;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;
const PASSWORD = process.env.SPAM_USER_PASSWORD ?? "Spam@123456";
const TOTAL_USERS = Number(process.env.SPAM_USER_TOTAL ?? 15);
const USERNAME_PREFIX = process.env.SPAM_USER_PREFIX ?? "nhatspam";
const EMAIL_DOMAIN = process.env.SPAM_USER_EMAIL_DOMAIN ?? "example.com";

if (!OWNER_IDENTIFIER || !OWNER_PASSWORD) {
  console.error("Missing OWNER_IDENTIFIER or OWNER_PASSWORD environment variables.");
  console.error(
    "Example: OWNER_IDENTIFIER=BirthDay OWNER_PASSWORD='Sinhnhat123@' pnpm spam:owner-users"
  );
  process.exit(1);
}

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const buildUserPayload = (index, branchIds) => {
  const sequence = index + 1;
  const role = sequence % 2 === 0 ? "KITCHEN" : "STAFF";
  const username = `${USERNAME_PREFIX}${sequence}`;

  return {
    fullName: `Nhat Spam ${sequence}`,
    username,
    email: `${username}@${EMAIL_DOMAIN}`,
    phoneNumber: `090000${String(sequence).padStart(4, "0")}`,
    password: PASSWORD,
    role,
    branchIds,
  };
};

const run = async () => {
  console.log(`Logging in to ${API_URL} as owner ${OWNER_IDENTIFIER}...`);

  const loginResponse = await client.post("/api/auth/login", {
    identifier: OWNER_IDENTIFIER,
    password: OWNER_PASSWORD,
  });

  const accessToken = loginResponse.data?.result?.accessToken;

  if (!accessToken) {
    throw new Error("Owner login succeeded but no access token was returned.");
  }

  client.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

  const branchesResponse = await client.get("/api/owner/branches", {
    params: {
      pageNumber: 1,
      pageSize: 100,
      sortBy: "name",
      sortDirection: "asc",
    },
  });

  const branches = branchesResponse.data?.result?.items ?? [];
  const branchIds = branches.map((branch) => branch.branchId);

  if (!branchIds.length) {
    throw new Error("No owner branches were returned, so users cannot be created.");
  }

  console.log(`Loaded ${branchIds.length} branches. Creating ${TOTAL_USERS} users...`);

  for (let index = 0; index < TOTAL_USERS; index += 1) {
    const payload = buildUserPayload(index, branchIds);

    try {
      await client.post("/api/owner/users", payload);
      console.log(`✅ Created ${payload.username} (${payload.role})`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";

      console.error(`❌ Failed to create ${payload.username}: ${message}`);
    }
  }

  console.log("Done.");
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Script failed: ${message}`);
  process.exit(1);
});
