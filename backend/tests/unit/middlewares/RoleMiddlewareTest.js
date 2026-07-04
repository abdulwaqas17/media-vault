import { jest } from "@jest/globals";

// Dynamic imports
const { ApiError } = await import("../../../src/utils/ApiError.js");
const { RoleMiddleware } = await import("../../../src/middlewares/RoleMiddleware.js");

describe("RoleMiddleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: {
        role: "Admin"
      }
    };

    mockRes = {};

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  // ============================================================
  // TEST 1: Should call next() when user has allowed role
  // ============================================================
  it("should call next() when user has allowed role", () => {
    const middleware = RoleMiddleware("Admin", "SuperAdmin");
    
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });


  // ============================================================
  // TEST 3: Should throw error when user role not allowed
  // ============================================================
  it("should throw ApiError when user role not allowed", () => {
    const middleware = RoleMiddleware("SuperAdmin", "Moderator");
    
    expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ApiError);
    expect(mockNext).not.toHaveBeenCalled();
  });


  // ============================================================
  // TEST 7: Should handle missing role in user object
  // ============================================================
  it("should throw error when role is missing in user", () => {
    mockReq.user = {};
    
    const middleware = RoleMiddleware("Admin");
    
    expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ApiError);
    expect(mockNext).not.toHaveBeenCalled();
  });
});