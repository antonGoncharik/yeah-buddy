import {
  type AuthorDigestStats,
  formatAuthorDigest,
} from "@/lib/analytics/author-digest";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

const sample: AuthorDigestStats = {
  newUsers: 3,
  activeUsers: 12,
  d7Rate: 0.42,
  donationStars: 50,
  reminderBlocked: 1,
  syncFailed: 2,
  aiFailed: 0,
};

const text = formatAuthorDigest(sample);
assert(text.includes("Новых: 3"), "lists new users");
assert(text.includes("42%"), "formats d7 percent");
assert(text.includes("50"), "lists stars");

console.log("analytics author digest ok");
