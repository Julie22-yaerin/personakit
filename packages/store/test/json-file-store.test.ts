import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PersonaVector, PublishedVideoRecord, VpsComponents } from "@personakit/shared-types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonFileStore } from "../src/json-file-store";

const persona: PersonaVector = {
  arrogance: 50,
  charisma: 50,
  vulnerability: 50,
  dominance: 50,
  humor: 50,
  warmth: 50,
  enigma: 50,
  provocation: 50,
};

const components: VpsComponents = {
  hook: 70,
  curiosityGap: 60,
  tension: 50,
  shareability: 55,
  provocation: 45,
  personaConsistency: 90,
  retention: 65,
  memorability: 50,
};

function makeRecord(overrides: Partial<PublishedVideoRecord> = {}): PublishedVideoRecord {
  return {
    videoId: "vid-1",
    creatorId: "creator-1",
    publishedAt: "2026-01-01T00:00:00.000Z",
    personaVector: persona,
    components,
    predictedVps: 62,
    ...overrides,
  };
}

let dir: string;
let store: JsonFileStore;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "personakit-store-"));
  store = new JsonFileStore(join(dir, "store.json"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("JsonFileStore", () => {
  it("round-trips a published video record", async () => {
    await store.addPublishedVideo(makeRecord());
    const fetched = await store.getPublishedVideo("creator-1", "vid-1");
    expect(fetched?.predictedVps).toBe(62);
  });

  it("rejects adding the same video id twice for the same creator", async () => {
    await store.addPublishedVideo(makeRecord());
    await expect(store.addPublishedVideo(makeRecord())).rejects.toThrow();
  });

  it("lists only the requesting creator's videos", async () => {
    await store.addPublishedVideo(makeRecord({ videoId: "vid-1", creatorId: "creator-1" }));
    await store.addPublishedVideo(makeRecord({ videoId: "vid-2", creatorId: "creator-2" }));
    const list = await store.listPublishedVideos("creator-1");
    expect(list).toHaveLength(1);
    expect(list[0].videoId).toBe("vid-1");
  });

  it("records actual performance onto an existing video", async () => {
    await store.addPublishedVideo(makeRecord());
    const updated = await store.recordPerformance("creator-1", "vid-1", {
      actual: {
        views: 10000,
        retention: 0.5,
        shares: 100,
        comments: 50,
        profileVisits: 200,
        conversions: 10,
      },
      actualRecordedAt: "2026-01-08T00:00:00.000Z",
      actualNormalized: 58,
      predictionError: 4,
    });
    expect(updated.actualNormalized).toBe(58);
    expect(updated.predictionError).toBe(4);

    const fetched = await store.getPublishedVideo("creator-1", "vid-1");
    expect(fetched?.actual?.views).toBe(10000);
  });

  it("throws when recording performance for a video that doesn't exist", async () => {
    await expect(
      store.recordPerformance("creator-1", "missing", {
        actual: {
          views: 1,
          retention: 0.1,
          shares: 0,
          comments: 0,
          profileVisits: 0,
          conversions: 0,
        },
        actualRecordedAt: "2026-01-08T00:00:00.000Z",
        actualNormalized: 10,
        predictionError: 5,
      }),
    ).rejects.toThrow();
  });

  it("round-trips creator calibration and overwrites on save", async () => {
    const weights = {
      hook: 0.3,
      curiosityGap: 0.15,
      tension: 0.15,
      shareability: 0.15,
      provocation: 0.1,
      personaConsistency: 0.05,
      retention: 0.05,
      memorability: 0.05,
    };
    await store.saveCalibration({
      creatorId: "creator-1",
      weights,
      sampleCount: 5,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    let calibration = await store.getCalibration("creator-1");
    expect(calibration?.sampleCount).toBe(5);

    await store.saveCalibration({
      creatorId: "creator-1",
      weights,
      sampleCount: 10,
      updatedAt: "2026-01-08T00:00:00.000Z",
    });
    calibration = await store.getCalibration("creator-1");
    expect(calibration?.sampleCount).toBe(10);
  });

  it("survives concurrent writes without losing records (serialized queue)", async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        store.addPublishedVideo(makeRecord({ videoId: `vid-${i}` })),
      ),
    );
    const list = await store.listPublishedVideos("creator-1");
    expect(list).toHaveLength(10);
  });
});
