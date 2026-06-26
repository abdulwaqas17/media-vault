import {
  PresignedUrlSchema,
  UpdateProfileSchema,
} from "../../../src/modules/profile/ProfileValidation";
import { ImageType } from "../../../src/constants/constants.js";

describe("Profile Validation Schemas", () => {
  // ============================================================
  // PRESIGNED URL SCHEMA TESTS
  // ============================================================
  describe("PresignedUrlSchema", () => {
    // 1. Happy path - Valid data
    it("should validate correct presigned URL request", () => {
      const validData = {
        asset_type: ImageType.Profile_Picture,
        file_name: "profile-photo.jpg",
        mime_type: "image/jpeg",
      };

      const { error } = PresignedUrlSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it("should validate with Company_Logo asset type", () => {
      const validData = {
        asset_type: ImageType.Company_Logo,
        file_name: "company-logo.png",
        mime_type: "image/png",
      };

      const { error } = PresignedUrlSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    // 2. Asset type validation tests
    describe("Asset Type Validation", () => {
      it("should reject missing asset_type", () => {
        const invalidData = {
          file_name: "profile-photo.jpg",
          mime_type: "image/jpeg",
        };

        const { error } = PresignedUrlSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject invalid asset_type", () => {
        const invalidData = {
          asset_type: "INVALID_TYPE",
          file_name: "profile-photo.jpg",
          mime_type: "image/jpeg",
        };

        const { error } = PresignedUrlSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    // 3. File name validation tests
    describe("File Name Validation", () => {
      it("should reject missing file_name", () => {
        const invalidData = {
          asset_type: ImageType.Profile_Picture,
          mime_type: "image/jpeg",
        };

        const { error } = PresignedUrlSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject empty file_name", () => {
        const invalidData = {
          asset_type: ImageType.Profile_Picture,
          file_name: "",
          mime_type: "image/jpeg",
        };

        const { error } = PresignedUrlSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    // 4. Mime type validation tests
    describe("Mime Type Validation", () => {
      it("should reject missing mime_type", () => {
        const invalidData = {
          asset_type: ImageType.Profile_Picture,
          file_name: "profile-photo.jpg",
        };

        const { error } = PresignedUrlSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should accept various mime types", () => {
        const mimeTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ];

        mimeTypes.forEach((mime_type) => {
          const validData = {
            asset_type: ImageType.Profile_Picture,
            file_name: "photo.jpg",
            mime_type: mime_type,
          };

          const { error } = PresignedUrlSchema.validate(validData);
          expect(error).toBeUndefined();
        });
      });
    });
  });

  // ============================================================
  // UPDATE PROFILE SCHEMA TESTS
  // ============================================================
  describe("UpdateProfileSchema", () => {
    // 1. Happy path - Valid data
    it("should validate correct profile update data", () => {
      const validData = {
        full_name: "John Doe",
        designation: "Software Engineer",
        contact_number: "+92 300 1234567",
        connect_me_for: "Software Development, Technical Consulting",
        company_name: "Tech Solutions Inc",
        media_assets: [
          {
            asset_type: ImageType.Profile_Picture,
            s3_key: "profiles/user_123/profile.jpg",
            cdn_url: "https://cdn.example.com/profiles/user_123/profile.jpg",
            mime_type: "image/jpeg",
          },
          {
            asset_type: ImageType.Company_Logo,
            s3_key: "profiles/user_123/logo.png",
            cdn_url: "https://cdn.example.com/profiles/user_123/logo.png",
            mime_type: "image/png",
          },
        ],
      };

      const { error } = UpdateProfileSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    // 2. Required fields tests
    describe("Required Fields Validation", () => {
      it("should reject missing full_name", () => {
        const invalidData = {
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject missing designation", () => {
        const invalidData = {
          full_name: "John Doe",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject missing contact_number", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject missing connect_me_for", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject missing company_name", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject missing media_assets", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    // 4. Password validation tests
    describe("Password Validation", () => {
      it("should accept valid password (min 6, max 50)", () => {
        const validData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          password: "Secure123",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject password shorter than 6 characters", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          password: "12345",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should accept password as optional", () => {
        const validData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          // password is optional - not provided
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    // 5. Media assets validation tests
    describe("Media Assets Validation", () => {
      it("should reject when exactly 2 items are not provided", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            // Only one asset provided - should fail
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject when Profile_Picture is missing", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/png",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject media_assets with invalid asset_type", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: "INVALID_TYPE",
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it("should reject media_assets with missing required fields", () => {
        const invalidData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
            }, // missing mime_type
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });

    // 6. Combination tests
    describe("Combination Tests", () => {
      it("should accept user_id as optional field", () => {
        const validData = {
          full_name: "John Doe",
          designation: "Software Engineer",
          contact_number: "+92 300 1234567",
          connect_me_for: "Software Development",
          company_name: "Tech Solutions Inc",
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            {
              asset_type: ImageType.Company_Logo,
              s3_key: "key2",
              cdn_url: "url2",
              mime_type: "image/png",
            },
          ],
        };

        const { error } = UpdateProfileSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it("should reject with multiple validation errors", () => {
        const invalidData = {
          full_name: "",
          designation: "",
          // Missing other required fields
          media_assets: [
            {
              asset_type: ImageType.Profile_Picture,
              s3_key: "key1",
              cdn_url: "url1",
              mime_type: "image/jpeg",
            },
            // Only one asset - should fail length check
          ],
        };

        const { error } = UpdateProfileSchema.validate(invalidData);
        expect(error).toBeDefined();
        // Joi returns the first error by default
      });
    });
  });
});
