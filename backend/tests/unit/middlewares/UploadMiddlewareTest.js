// // tests/unit/middlewares/UploadMiddlewareTest.js

// import { jest } from "@jest/globals";

// // Mock fs - simple
// jest.unstable_mockModule("fs", () => ({
//   existsSync: jest.fn().mockReturnValue(true),
//   mkdirSync: jest.fn()
// }));

// // Mock multer - WITH diskStorage and memoryStorage
// jest.unstable_mockModule("multer", () => {
//   const diskStorage = jest.fn().mockImplementation((config) => ({
//     destination: config.destination,
//     filename: config.filename
//   }));
  
//   const memoryStorage = jest.fn().mockReturnValue({});
  
//   const multerFn = jest.fn().mockImplementation((config) => ({
//     single: jest.fn(),
//     array: jest.fn(),
//     fields: jest.fn()
//   }));
  
//   multerFn.diskStorage = diskStorage;
//   multerFn.memoryStorage = memoryStorage;
  
//   return {
//     default: multerFn
//   };
// });

// // Dynamic imports
// const multer = (await import("multer")).default;
// const { 
//   UploadMiddleware, 
//   UploadMemoryMiddleware,
//   fileFilter,
//   storage
// } = await import("../../../src/middlewares/UploadMiddleware.js");

// describe("UploadMiddleware", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   // ============================================================
//   // TEST 1: fileFilter - Accept valid image files
//   // ============================================================
//   describe("fileFilter", () => {
//     it("should accept valid image files", () => {
//       const mockReq = {};
//       const mockCb = jest.fn();
      
//       const validFiles = [
//         { originalname: "photo.jpg" },
//         { originalname: "image.jpeg" },
//         { originalname: "picture.png" },
//         { originalname: "graphic.gif" },
//         { originalname: "logo.webp" },
//         { originalname: "photo.JPG" },
//         { originalname: "image.JPEG" }
//       ];

//       validFiles.forEach((file) => {
//         fileFilter(mockReq, file, mockCb);
//         expect(mockCb).toHaveBeenCalledWith(null, true);
//         mockCb.mockClear();
//       });
//     });

//     it("should reject non-image files", () => {
//       const mockReq = {};
//       const mockCb = jest.fn();
      
//       const invalidFiles = [
//         { originalname: "document.pdf" },
//         { originalname: "file.txt" },
//         { originalname: "video.mp4" },
//         { originalname: "script.js" }
//       ];

//       invalidFiles.forEach((file) => {
//         fileFilter(mockReq, file, mockCb);
//         expect(mockCb).toHaveBeenCalledWith(
//           expect.any(Error),
//           false
//         );
//         mockCb.mockClear();
//       });
//     });
//   });

//   // ============================================================
//   // TEST 2: storage - destination function
//   // ============================================================
//   describe("storage destination", () => {
//     it("should call callback with upload directory", () => {
//       const mockCb = jest.fn();
//       const mockReq = {};
//       const mockFile = {};
      
//       // Get destination function from storage
//       const destinationFn = storage.destination;
//       destinationFn(mockReq, mockFile, mockCb);
      
//       expect(mockCb).toHaveBeenCalledWith(null, expect.stringContaining("uploads"));
//     });
//   });

//   // ============================================================
//   // TEST 3: storage - filename function
//   // ============================================================
//   describe("storage filename", () => {
//     it("should generate unique filename with extension", () => {
//       const mockCb = jest.fn();
//       const mockReq = {};
//       const mockFile = { originalname: "test.jpg" };
      
//       const filenameFn = storage.filename;
//       filenameFn(mockReq, mockFile, mockCb);
      
//       expect(mockCb).toHaveBeenCalledWith(
//         null,
//         expect.stringMatching(/^\d+-\d+\.jpg$/)
//       );
//     });

//     it("should preserve file extension", () => {
//       const mockCb = jest.fn();
//       const mockReq = {};
//       const mockFile = { originalname: "photo.png" };
      
//       const filenameFn = storage.filename;
//       filenameFn(mockReq, mockFile, mockCb);
      
//       expect(mockCb).toHaveBeenCalledWith(
//         null,
//         expect.stringMatching(/\.png$/)
//       );
//     });

//     it("should handle different file extensions", () => {
//       const mockCb = jest.fn();
//       const mockReq = {};
      
//       const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
//       extensions.forEach((ext) => {
//         const mockFile = { originalname: `test.${ext}` };
//         const filenameFn = storage.filename;
//         filenameFn(mockReq, mockFile, mockCb);
        
//         expect(mockCb).toHaveBeenCalledWith(
//           null,
//           expect.stringMatching(new RegExp(`\\.${ext}$`))
//         );
//         mockCb.mockClear();
//       });
//     });
//   });

//   // ============================================================
//   // TEST 4: UploadMiddleware - Configuration
//   // ============================================================
//   describe("UploadMiddleware", () => {
//     it("should be configured with storage, fileFilter, and limits", () => {
//       // Check that multer was called with correct config
//       expect(multer).toHaveBeenCalled();
      
//       const callArgs = multer.mock.calls[0][0];
//       expect(callArgs).toMatchObject({
//         limits: { fileSize: 5 * 1024 * 1024 }
//       });
//       expect(callArgs.storage).toBeDefined();
//       expect(callArgs.fileFilter).toBeDefined();
//     });

//     it("should have single, array, and fields methods", () => {
//       expect(UploadMiddleware.single).toBeDefined();
//       expect(UploadMiddleware.array).toBeDefined();
//       expect(UploadMiddleware.fields).toBeDefined();
//     });
//   });

//   // ============================================================
//   // TEST 5: UploadMemoryMiddleware - Configuration
//   // ============================================================
//   describe("UploadMemoryMiddleware", () => {
//     it("should be configured with memory storage", () => {
//       expect(UploadMemoryMiddleware).toBeDefined();
//       expect(UploadMemoryMiddleware.single).toBeDefined();
//       expect(UploadMemoryMiddleware.array).toBeDefined();
//       expect(UploadMemoryMiddleware.fields).toBeDefined();
//     });

//     it("should have fileFilter and limits", () => {
//       // Check multer was called at least twice (for disk and memory)
//       expect(multer).toHaveBeenCalled();
      
//       // Get all calls
//       const allCalls = multer.mock.calls;
//       // At least one call should have memory storage
//       const hasMemoryStorage = allCalls.some((call) => {
//         const config = call[0];
//         return config && config.storage && config.limits;
//       });
      
//       expect(hasMemoryStorage).toBe(true);
//     });
//   });
// });