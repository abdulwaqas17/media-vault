import { jest } from "@jest/globals";

// Mock sanitizer
jest.unstable_mockModule("../../../src/utils/sanitizer.js", () => ({
  SanitizeObject: jest.fn()
}));

// Dynamic imports
const { ApiError } = await import("../../../src/utils/ApiError.js");
const { SanitizeObject } = await import("../../../src/utils/sanitizer.js");
const { ValidateAndSanitize } = await import("../../../src/middlewares/ValidateMiddleware.js");

describe("ValidateAndSanitize", () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockSchema;

  beforeEach(() => {
    mockReq = {
      body: {
        name: "  John  ",
        email: "john@example.com"
      }
    };

    mockRes = {};

    mockNext = jest.fn();

    mockSchema = {
      validate: jest.fn()
    };

    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: Should call next() when validation passes
  // ============================================================
  it("should call next() when validation passes", () => {
    const validatedValue = {
      name: "  John  ",
      email: "john@example.com"
    };
    const sanitizedValue = {
      name: "John",
      email: "john@example.com"
    };

    mockSchema.validate.mockReturnValue({
      error: null,
      value: validatedValue
    });

    SanitizeObject.mockReturnValue(sanitizedValue);

    const middleware = ValidateAndSanitize(mockSchema);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
  });

  // ============================================================
  // TEST 2: Should call next with ApiError when validation fails
  // ============================================================
  it("should call next with ApiError when validation fails", () => {
    const validationError = {
      details: [{ message: "Name is required" }]
    };

    mockSchema.validate.mockReturnValue({
      error: validationError,
      value: {}
    });

    const middleware = ValidateAndSanitize(mockSchema);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(SanitizeObject).not.toHaveBeenCalled();
  });

  // ============================================================
  // TEST 3: Should sanitize validated data
  // ============================================================
  it("should sanitize validated data", () => {
    const validatedValue = {
      name: "  John  ",
      email: "john@example.com"
    };
    const sanitizedValue = {
      name: "John",
      email: "john@example.com"
    };

    mockSchema.validate.mockReturnValue({
      error: null,
      value: validatedValue
    });

    SanitizeObject.mockReturnValue(sanitizedValue);

    const middleware = ValidateAndSanitize(mockSchema);
    middleware(mockReq, mockRes, mockNext);

    expect(SanitizeObject).toHaveBeenCalledWith(validatedValue);
  });

  // ============================================================
  // TEST 4: Should assign sanitized data to req property
  // ============================================================
  it("should assign sanitized data to req body", () => {
    const validatedValue = {
      name: "  John  ",
      email: "john@example.com"
    };
    const sanitizedValue = {
      name: "John",
      email: "john@example.com"
    };

    mockSchema.validate.mockReturnValue({
      error: null,
      value: validatedValue
    });

    SanitizeObject.mockReturnValue(sanitizedValue);

    const middleware = ValidateAndSanitize(mockSchema);
    middleware(mockReq, mockRes, mockNext);

    expect(mockReq.body).toEqual(sanitizedValue);
    expect(mockReq.body.name).toBe("John");
  });

  // ============================================================
  // TEST 5: Should work with different request properties
  // ============================================================
  it("should work with different request properties", () => {
    mockReq.query = {
      name: "  John  "
    };

    const validatedValue = { name: "  John  " };
    const sanitizedValue = { name: "John" };

    mockSchema.validate.mockReturnValue({
      error: null,
      value: validatedValue
    });

    SanitizeObject.mockReturnValue(sanitizedValue);

    const middleware = ValidateAndSanitize(mockSchema, "query");
    middleware(mockReq, mockRes, mockNext);

    expect(mockReq.query).toEqual(sanitizedValue);
    expect(mockNext).toHaveBeenCalled();
  });
  
});