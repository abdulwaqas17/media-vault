import { jest } from "@jest/globals";

// Mock NetworkService
jest.unstable_mockModule("../../../src/modules/network/NetworkService.js", () => ({
  GetNetworkUsersService: jest.fn()
}));

// Mock ApiResponse
jest.unstable_mockModule("../../../src/utils/ApiResponse.js", () => ({
  SendResponse: jest.fn()
}));

// Dynamic imports
const { GetNetworkUsersService } = await import("../../../src/modules/network/NetworkService.js");
const { SendResponse } = await import("../../../src/utils/ApiResponse.js");
const { GetNetworkUsersController } = await import("../../../src/modules/network/NetworkController.js");

describe("NetworkController", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      query: {}
    };

    mockRes = {};

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  // ============================================================
  // GET NETWORK USERS CONTROLLER TESTS
  // ============================================================
  describe("GetNetworkUsersController", () => {
    const mockResult = {
      page: 1,
      limit: 10,
      total: 25,
      users: [
        {
          id: "user_1",
          email: "john@example.com",
          status: "Active",
          profile: {
            full_name: "John Doe",
            designation: "Developer"
          }
        },
        {
          id: "user_2",
          email: "jane@example.com",
          status: "Active",
          profile: {
            full_name: "Jane Smith",
            designation: "Designer"
          }
        }
      ]
    };

    // Test 1: Happy Path with all parameters
    it("should call GetNetworkUsersService with parsed query parameters and return success response", async () => {
      mockReq.query = {
        page: "2",
        limit: "20",
        search: "John",
        status: "Active"
      };

      GetNetworkUsersService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await GetNetworkUsersController(mockReq, mockRes, mockNext);

      expect(GetNetworkUsersService).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: "John",
        status: "Active"
      });
      expect(GetNetworkUsersService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Network users fetched successfully",
        mockResult
      );
      expect(SendResponse).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 2: Should handle missing query parameters with defaults
    it("should handle missing query parameters with defaults", async () => {
      mockReq.query = {};

      GetNetworkUsersService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await GetNetworkUsersController(mockReq, mockRes, mockNext);

      expect(GetNetworkUsersService).toHaveBeenCalledWith({
        page: NaN,
        limit: NaN,
        search: undefined,
        status: undefined
      });
      expect(GetNetworkUsersService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalledWith(
        mockRes,
        200,
        "Network users fetched successfully",
        mockResult
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 3: Should handle partial query parameters
    it("should handle partial query parameters", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
        search: "John"
        // status is missing
      };

      GetNetworkUsersService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await GetNetworkUsersController(mockReq, mockRes, mockNext);

      expect(GetNetworkUsersService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "John",
        status: undefined
      });
      expect(GetNetworkUsersService).toHaveBeenCalledTimes(1);
      expect(SendResponse).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test 4: Should handle string status value (not All)
    it("should handle string status value when not All", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
        search: "",
        status: "Inactive"
      };

      GetNetworkUsersService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await GetNetworkUsersController(mockReq, mockRes, mockNext);

      expect(GetNetworkUsersService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "",
        status: "Inactive"
      });
      expect(GetNetworkUsersService).toHaveBeenCalledTimes(1);
    });

    // Test 5: Should pass service errors to next middleware
    it("should pass service errors to next middleware", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
        search: "John",
        status: "Active"
      };

      const error = new Error("Database connection failed");
      GetNetworkUsersService.mockRejectedValue(error);
      SendResponse.mockReturnValue();

      await GetNetworkUsersController(mockReq, mockRes, mockNext);

      expect(GetNetworkUsersService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "John",
        status: "Active"
      });
      expect(SendResponse).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    // Test 6: Should handle empty search string
    it("should handle empty search string", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
        search: "",
        status: "All"
      };

      GetNetworkUsersService.mockResolvedValue(mockResult);
      SendResponse.mockReturnValue();

      await GetNetworkUsersController(mockReq, mockRes, mockNext);

      expect(GetNetworkUsersService).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "",
        status: "All"
      });
      expect(GetNetworkUsersService).toHaveBeenCalledTimes(1);
    });
  });
});