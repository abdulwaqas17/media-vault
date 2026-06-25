import { NetworkListSchema } from "../../../src/modules/network/NetworkValidation.js";
import { UserStatus } from "../../../src/constants/constants.js";

describe("NetworkListSchema", () => {
  // ============================================================
  // 1. VALID DATA
  // ============================================================
  it("should validate with all valid params", () => {
    const { error } = NetworkListSchema.validate({
      page: 2,
      limit: 50,
      search: "John",
      status: UserStatus.Active,
    });
    expect(error).toBeUndefined();
  });

  // ============================================================
  // 2. PAGE VALIDATION
  // ============================================================
  it("should reject page less than 1", () => {
    const { error } = NetworkListSchema.validate({ page: 0 });
    expect(error).toBeDefined();
  });

  // ============================================================
  // 3. LIMIT VALIDATION
  // ============================================================
  it("should reject limit less than 1", () => {
    const { error } = NetworkListSchema.validate({ limit: 0 });
    expect(error).toBeDefined;
  });

  it("should reject limit greater than 100", () => {
    const { error } = NetworkListSchema.validate({ limit: 101 });
    expect(error).toBeDefined;
  });

  it("should reject limit as string", () => {
    const { error } = NetworkListSchema.validate({ limit: "abc" });
    expect(error.message).toContain("Limit must be a number");
  });

  it("should reject invalid status", () => {
    const { error } = NetworkListSchema.validate({ status: "Invalid" });
    expect(error.message).toContain(
      "Status must be one of Active, Inactive, or All",
    );
  });
});
