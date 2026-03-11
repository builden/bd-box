import { describe, it, expect } from "bun:test";
import {
  isSshGitUrl,
  shouldShowGithubAuthentication,
  isCloneWorkflow,
  getSuggestionRootPath,
  getParentPath,
  joinFolderPath,
} from "./pathUtils";

describe("pathUtils", () => {
  describe("isSshGitUrl", () => {
    it("should return true for SSH URLs with git@ prefix", () => {
      expect(isSshGitUrl("git@github.com:user/repo.git")).toBe(true);
    });

    it("should return true for SSH URLs with ssh:// prefix", () => {
      expect(isSshGitUrl("ssh://git@github.com/user/repo.git")).toBe(true);
    });

    it("should return false for HTTPS URLs", () => {
      expect(isSshGitUrl("https://github.com/user/repo.git")).toBe(false);
    });

    it("should trim whitespace before checking", () => {
      expect(isSshGitUrl("  git@github.com:user/repo.git")).toBe(true);
    });
  });

  describe("shouldShowGithubAuthentication", () => {
    it("should return true for new workspace with HTTPS URL", () => {
      expect(shouldShowGithubAuthentication("new", "https://github.com/user/repo")).toBe(true);
    });

    it("should return false for new workspace with SSH URL", () => {
      expect(shouldShowGithubAuthentication("new", "git@github.com:user/repo")).toBe(false);
    });

    it("should return false for existing workspace", () => {
      expect(shouldShowGithubAuthentication("existing", "https://github.com/user/repo")).toBe(false);
    });

    it("should return false for empty URL", () => {
      expect(shouldShowGithubAuthentication("new", "")).toBe(false);
    });
  });

  describe("isCloneWorkflow", () => {
    it("should return true for new workspace with URL", () => {
      expect(isCloneWorkflow("new", "https://github.com/user/repo")).toBe(true);
    });

    it("should return false for existing workspace", () => {
      expect(isCloneWorkflow("existing", "https://github.com/user/repo")).toBe(false);
    });

    it("should return false for empty URL", () => {
      expect(isCloneWorkflow("new", "")).toBe(false);
    });
  });

  describe("getSuggestionRootPath", () => {
    it("should return parent path for normal paths", () => {
      expect(getSuggestionRootPath("/home/user/projects")).toBe("/home/user");
    });

    it("should return parent path for Windows paths", () => {
      expect(getSuggestionRootPath("C:\\Users\\Admin")).toBe("C:\\Users");
    });

    it("should return tilde for single path component", () => {
      expect(getSuggestionRootPath("projects")).toBe("~");
    });

    it("should handle trailing separators", () => {
      expect(getSuggestionRootPath("/home/user/")).toBe("/home/user");
    });
  });

  describe("getParentPath", () => {
    it("should return parent for Unix paths", () => {
      expect(getParentPath("/home/user/file.txt")).toBe("/home/user");
    });

    it("should return parent for Windows paths", () => {
      expect(getParentPath("C:\\Users\\Admin\\file.txt")).toBe("C:\\Users\\Admin");
    });

    it("should return null for root paths", () => {
      expect(getParentPath("~")).toBeNull();
      expect(getParentPath("/")).toBeNull();
    });

    it("should return null for Windows drive root", () => {
      expect(getParentPath("C:\\")).toBeNull();
      expect(getParentPath("C:")).toBeNull();
    });

    it("should return slash for top-level Unix paths", () => {
      expect(getParentPath("/file.txt")).toBe("/");
    });
  });

  describe("joinFolderPath", () => {
    it("should join paths with forward slash for Unix", () => {
      expect(joinFolderPath("/home/user", "projects")).toBe("/home/user/projects");
    });

    it("should join paths with backslash for Windows", () => {
      expect(joinFolderPath("C:\\Users\\Admin", "Documents")).toBe("C:\\Users\\Admin\\Documents");
    });

    it("should trim trailing separators from base path", () => {
      expect(joinFolderPath("/home/user/", "projects")).toBe("/home/user/projects");
    });

    it("should trim whitespace from inputs", () => {
      expect(joinFolderPath("  /home/user  ", "  projects  ")).toBe("/home/user/projects");
    });
  });
});
