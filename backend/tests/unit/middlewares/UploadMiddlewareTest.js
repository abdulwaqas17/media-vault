import { jest } from "@jest/globals";

// ------------------------------------------------------------
// Mock multer
// ------------------------------------------------------------
jest.unstable_mockModule("multer", () => {
  const diskStorage = jest.fn((options) => options);
  const memoryStorage = jest.fn(() => ({}));

  const multer = jest.fn(() => ({}));

  multer.diskStorage = diskStorage;
  multer.memoryStorage = memoryStorage;

  return {
    default: multer,
  };
});

// ------------------------------------------------------------
// Mock fs
// ------------------------------------------------------------
jest.unstable_mockModule("fs", () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

// ------------------------------------------------------------
// Imports
// ------------------------------------------------------------
const { fileFilter, storage } = await import(
  "../../../src/middlewares/UploadMiddleware.js"
);

describe("UploadMiddleware", () => {
  // ============================================================
  // FILE FILTER
  // ============================================================

  it("should accept supported image extensions", () => {
    const cb = jest.fn();

    fileFilter(
      {},
      { originalname: "photo.jpg" },
      cb
    );

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("should reject unsupported file extensions", () => {
    const cb = jest.fn();

    fileFilter(
      {},
      { originalname: "document.pdf" },
      cb
    );

    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
  });

  // ============================================================
  // STORAGE
  // ============================================================

  it("should preserve original file extension when generating filename", () => {
    const cb = jest.fn();

    storage.filename(
      {},
      { originalname: "avatar.png" },
      cb
    );

    const generatedName = cb.mock.calls[0][1];

    expect(generatedName.endsWith(".png")).toBe(true);
  });

  it("should generate unique filenames", () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();

    storage.filename({}, { originalname: "a.jpg" }, cb1);
    storage.filename({}, { originalname: "a.jpg" }, cb2);

    const first = cb1.mock.calls[0][1];
    const second = cb2.mock.calls[0][1];

    expect(first).not.toBe(second);
  });
});