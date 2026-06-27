import { ApiError } from "../../../src/utils/ApiError.js";

describe("ApiError", () => {
  
  // ============================================================
  // TEST 1: Happy Path - Create error with status and message
  // ============================================================
  it("should create error with status code and message", () => {
    const error = new ApiError(404, "User not found");
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("User not found");
  });


  // ============================================================
  // TEST 2: Error should have stack trace
  // ============================================================
  it("should have stack trace", () => {
    const error = new ApiError(500, "Internal server error");
    
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe("string");
  });
});