import assert from "node:assert/strict";
import test from "node:test";
import {
  applyExplicitMutationOverrides,
  extractExplicitHeadlineOverride,
} from "@/lib/agent-explicit-overrides";

test("extractExplicitHeadlineOverride returns the literal requested headline", () => {
  assert.equal(
    extractExplicitHeadlineOverride(
      "Update my headline to Full-Stack Engineer building AI tools"
    ),
    "Full-Stack Engineer building AI tools"
  );
  assert.equal(
    extractExplicitHeadlineOverride('headline: "AI Product Engineer"'),
    "AI Product Engineer"
  );
});

test("extractExplicitHeadlineOverride ignores non-literal rewrite requests", () => {
  assert.equal(
    extractExplicitHeadlineOverride("Make my headline more technical"),
    null
  );
  assert.equal(
    extractExplicitHeadlineOverride("Update my headline to be more technical"),
    null
  );
});

test("applyExplicitMutationOverrides preserves existing patch fields while forcing the headline", () => {
  const result = applyExplicitMutationOverrides({
    allowedTargets: ["profile.headline", "profile.about"],
    message: "Replace my headline with Systems Engineer building AI tooling.",
    patch: {
      profile: {
        about: "Existing about copy",
        headline: "Old headline",
      },
    },
  });

  assert.equal(
    result.patch.profile?.headline,
    "Systems Engineer building AI tooling"
  );
  assert.equal(result.patch.profile?.about, "Existing about copy");
  assert.equal(result.exactHeadline, "Systems Engineer building AI tooling");
});
