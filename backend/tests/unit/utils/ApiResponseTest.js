import { jest } from "@jest/globals";
import { SendResponse } from "../../../src/utils/ApiResponse.js";

describe("ApiResponse", () => {
  
  // Mock Express response object
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ============================================================
  // TEST 1: Happy Path - Send success response with data
  // ============================================================
  it("should send success response with data", () => {
    const data = { id: 1, name: "John Doe" };
    
    SendResponse(mockRes, 200, "User found", data);
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "User found",
      data: data,
    });
  });

  // ============================================================
  // TEST 2: Default data = null when not provided
  // ============================================================
  it("should send null when data is not provided", () => {
    SendResponse(mockRes, 200, "Operation successful");
    
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "Operation successful",
      data: null,
    });
  });

  // ============================================================
  // TEST 3: Return response object
  // ============================================================
  it("should return response object", () => {
    const result = SendResponse(mockRes, 200, "Success");
    
    expect(result).toBeDefined();
    expect(result.status).toBe(mockRes.status);
    expect(result.json).toBe(mockRes.json);
  });
});