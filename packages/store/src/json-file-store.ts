import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { CreatorCalibration, PublishedVideoRecord } from "@personakit/shared-types";

export interface PersonaKitStore {
  addPublishedVideo(record: PublishedVideoRecord): Promise<void>;
  getPublishedVideo(creatorId: string, videoId: string): Promise<PublishedVideoRecord | undefined>;
  listPublishedVideos(creatorId: string): Promise<PublishedVideoRecord[]>;
  recordPerformance(
    creatorId: string,
    videoId: string,
    fields: Pick<
      PublishedVideoRecord,
      "actual" | "actualRecordedAt" | "actualNormalized" | "predictionError"
    >,
  ): Promise<PublishedVideoRecord>;
  getCalibration(creatorId: string): Promise<CreatorCalibration | undefined>;
  saveCalibration(calibration: CreatorCalibration): Promise<void>;
}

interface StoreData {
  videos: PublishedVideoRecord[];
  calibrations: CreatorCalibration[];
}

/**
 * DRM §17/§18 — the closed-loop pipeline's only real persistence
 * requirement: published videos + their actual performance, and each
 * creator's recalibrated VPS weights. A single JSON file is enough for the
 * "smallest functional version" (DRM Engineering Objective) of this loop;
 * swap this for a real database once there's more than one process writing
 * to it. Writes are serialized through an in-process queue so concurrent
 * requests in the same Node process don't race on the file.
 */
export class JsonFileStore implements PersonaKitStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async readData(): Promise<StoreData> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as StoreData;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return { videos: [], calibrations: [] };
      }
      throw err;
    }
  }

  private async writeData(data: StoreData): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  private mutate<T>(fn: (data: StoreData) => { data: StoreData; result: T }): Promise<T> {
    const run = this.queue.then(async () => {
      const data = await this.readData();
      const { data: nextData, result } = fn(data);
      await this.writeData(nextData);
      return result;
    });
    // Keep the queue alive even if this mutation rejects, so later callers
    // aren't stuck waiting on a promise that will never resolve.
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async addPublishedVideo(record: PublishedVideoRecord): Promise<void> {
    await this.mutate((data) => {
      const exists = data.videos.some(
        (v) => v.creatorId === record.creatorId && v.videoId === record.videoId,
      );
      if (exists) {
        throw new Error(`Video "${record.videoId}" already exists for creator "${record.creatorId}".`);
      }
      return { data: { ...data, videos: [...data.videos, record] }, result: undefined };
    });
  }

  async getPublishedVideo(
    creatorId: string,
    videoId: string,
  ): Promise<PublishedVideoRecord | undefined> {
    const data = await this.readData();
    return data.videos.find((v) => v.creatorId === creatorId && v.videoId === videoId);
  }

  async listPublishedVideos(creatorId: string): Promise<PublishedVideoRecord[]> {
    const data = await this.readData();
    return data.videos.filter((v) => v.creatorId === creatorId);
  }

  async recordPerformance(
    creatorId: string,
    videoId: string,
    fields: Pick<
      PublishedVideoRecord,
      "actual" | "actualRecordedAt" | "actualNormalized" | "predictionError"
    >,
  ): Promise<PublishedVideoRecord> {
    return this.mutate((data) => {
      const index = data.videos.findIndex(
        (v) => v.creatorId === creatorId && v.videoId === videoId,
      );
      if (index === -1) {
        throw new Error(`Video "${videoId}" not found for creator "${creatorId}".`);
      }
      const updated: PublishedVideoRecord = { ...data.videos[index], ...fields };
      const videos = [...data.videos];
      videos[index] = updated;
      return { data: { ...data, videos }, result: updated };
    });
  }

  async getCalibration(creatorId: string): Promise<CreatorCalibration | undefined> {
    const data = await this.readData();
    return data.calibrations.find((c) => c.creatorId === creatorId);
  }

  async saveCalibration(calibration: CreatorCalibration): Promise<void> {
    await this.mutate((data) => {
      const others = data.calibrations.filter((c) => c.creatorId !== calibration.creatorId);
      return { data: { ...data, calibrations: [...others, calibration] }, result: undefined };
    });
  }
}

export function createJsonFileStore(filePath: string): PersonaKitStore {
  return new JsonFileStore(filePath);
}
