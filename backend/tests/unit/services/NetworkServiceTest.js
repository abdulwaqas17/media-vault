import { jest } from "@jest/globals";

// Mock prisma
jest.unstable_mockModule("../../../src/config/prisma.js", () => ({
  default: {
    users: {
      count: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

// Mock constants
jest.unstable_mockModule("../../../src/constants/constants.js", () => ({
  UserStatus: {
    All: "All",
    Active: "Active",
    Inactive: "Inactive"
  }
}));

// Dynamic imports
const prisma = (await import("../../../src/config/prisma.js")).default;
const { UserStatus } = await import("../../../src/constants/constants.js");
const { GetNetworkUsersService } = await import("../../../src/modules/network/NetworkService.js");

describe("GetNetworkUsersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUsers = [
    {
      id: "user_1",
      email: "john@example.com",
      status: "Active",
      profile: { full_name: "John Doe", designation: "Developer", company_name: "Tech Corp" },
      media_assets: [],
      role: { name: "Member" }
    },
    {
      id: "user_2",
      email: "jane@example.com",
      status: "Active",
      profile: { full_name: "Jane Smith", designation: "Designer", company_name: "Design Co" },
      media_assets: [],
      role: { name: "Member" }
    }
  ];

  // ============================================================
  // TEST 1: Should return paginated users successfully
  // ============================================================
  it("should return paginated users successfully", async () => {
    const params = {
      page: 1,
      limit: 10,
      search: "",
      status: UserStatus.All
    };

    prisma.users.count.mockResolvedValue(2);
    prisma.users.findMany.mockResolvedValue(mockUsers);

    const result = await GetNetworkUsersService(params);

    expect(result).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      users: mockUsers
    });

    expect(prisma.users.count).toHaveBeenCalledWith({
      where: {}
    });

    expect(prisma.users.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      select: {
        id: true,
        email: true,
        status: true,
        profile: true,
        media_assets: true,
        role: true
      },
      orderBy: {
        profile: {
          full_name: "asc"
        }
      }
    });
  });

  // ============================================================
  // TEST 2: Should apply search filters when search is provided
  // ============================================================
  it("should apply search filters when search is provided", async () => {
    const params = {
      page: 1,
      limit: 10,
      search: "John",
      status: UserStatus.All
    };

    prisma.users.count.mockResolvedValue(1);
    prisma.users.findMany.mockResolvedValue([mockUsers[0]]);

    await GetNetworkUsersService(params);

    const expectedSearchFilter = {
      OR: [
        { profile: { full_name: { contains: "John", mode: "insensitive" } } },
        { email: { contains: "John", mode: "insensitive" } },
        { profile: { designation: { contains: "John", mode: "insensitive" } } },
        { profile: { company_name: { contains: "John", mode: "insensitive" } } }
      ]
    };

    expect(prisma.users.count).toHaveBeenCalledWith({
      where: expectedSearchFilter
    });

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedSearchFilter
      })
    );
  });

  // ============================================================
  // TEST 3: Should apply status filter when status is not All
  // ============================================================
  it("should apply status filter when status is not All", async () => {
    const params = {
      page: 1,
      limit: 10,
      search: "",
      status: UserStatus.Active
    };

    prisma.users.count.mockResolvedValue(2);
    prisma.users.findMany.mockResolvedValue(mockUsers);

    await GetNetworkUsersService(params);

    expect(prisma.users.count).toHaveBeenCalledWith({
      where: { status: UserStatus.Active }
    });

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: UserStatus.Active }
      })
    );
  });

  // ============================================================
  // TEST 4: Should ignore status filter when status is All
  // ============================================================
  it("should ignore status filter when status is All", async () => {
    const params = {
      page: 1,
      limit: 10,
      search: "",
      status: UserStatus.All
    };

    prisma.users.count.mockResolvedValue(2);
    prisma.users.findMany.mockResolvedValue(mockUsers);

    await GetNetworkUsersService(params);

    // Status filter should NOT be in where clause
    expect(prisma.users.count).toHaveBeenCalledWith({
      where: {}
    });

    expect(prisma.users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {}
      })
    );
  });

  // ============================================================
  // TEST 5: Should calculate pagination (skip & take) correctly
  // ============================================================
  it("should calculate pagination correctly", async () => {
    const testCases = [
      { page: 1, limit: 10, expectedSkip: 0, expectedTake: 10 },
      { page: 2, limit: 10, expectedSkip: 10, expectedTake: 10 },
      { page: 3, limit: 20, expectedSkip: 40, expectedTake: 20 },
      { page: 1, limit: 5, expectedSkip: 0, expectedTake: 5 },
      { page: 4, limit: 15, expectedSkip: 45, expectedTake: 15 }
    ];

    for (const testCase of testCases) {
      const params = {
        page: testCase.page,
        limit: testCase.limit,
        search: "",
        status: UserStatus.All
      };

      prisma.users.count.mockResolvedValue(0);
      prisma.users.findMany.mockResolvedValue([]);

      await GetNetworkUsersService(params);

      expect(prisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: testCase.expectedSkip,
          take: testCase.expectedTake
        })
      );

      jest.clearAllMocks();
    }
  });

  // ============================================================
  // TEST 6: Should propagate prisma errors
  // ============================================================
  it("should propagate prisma errors", async () => {
    const params = {
      page: 1,
      limit: 10,
      search: "",
      status: UserStatus.All
    };

    const dbError = new Error("Database connection failed");
    prisma.users.count.mockRejectedValue(dbError);

    await expect(GetNetworkUsersService(params)).rejects.toThrow(
      "Database connection failed"
    );
  });
});