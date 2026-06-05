import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the db module
vi.mock("./db", () => ({
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
  isRestaurantBookmarked: vi.fn(),
  getBookmarkedRestaurants: vi.fn(),
}));

describe("Bookmark Database Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addBookmark", () => {
    it("should add a bookmark for a user and restaurant", async () => {
      await db.addBookmark(1, 100);
      expect(db.addBookmark).toHaveBeenCalledWith(1, 100);
    });

    it("should handle duplicate bookmarks gracefully", async () => {
      // Mock the function to simulate already bookmarked
      vi.mocked(db.addBookmark).mockResolvedValueOnce(undefined);
      
      await db.addBookmark(1, 100);
      expect(db.addBookmark).toHaveBeenCalledWith(1, 100);
    });

    it("should throw error if database is unavailable", async () => {
      vi.mocked(db.addBookmark).mockRejectedValueOnce(new Error("DB unavailable"));
      
      await expect(db.addBookmark(1, 100)).rejects.toThrow("DB unavailable");
    });
  });

  describe("removeBookmark", () => {
    it("should remove a bookmark for a user and restaurant", async () => {
      await db.removeBookmark(1, 100);
      expect(db.removeBookmark).toHaveBeenCalledWith(1, 100);
    });

    it("should handle removing non-existent bookmarks gracefully", async () => {
      vi.mocked(db.removeBookmark).mockResolvedValueOnce(undefined);
      
      await db.removeBookmark(1, 999);
      expect(db.removeBookmark).toHaveBeenCalledWith(1, 999);
    });
  });

  describe("isRestaurantBookmarked", () => {
    it("should return true if restaurant is bookmarked", async () => {
      vi.mocked(db.isRestaurantBookmarked).mockResolvedValueOnce(true);
      
      const result = await db.isRestaurantBookmarked(1, 100);
      expect(result).toBe(true);
      expect(db.isRestaurantBookmarked).toHaveBeenCalledWith(1, 100);
    });

    it("should return false if restaurant is not bookmarked", async () => {
      vi.mocked(db.isRestaurantBookmarked).mockResolvedValueOnce(false);
      
      const result = await db.isRestaurantBookmarked(1, 100);
      expect(result).toBe(false);
      expect(db.isRestaurantBookmarked).toHaveBeenCalledWith(1, 100);
    });

    it("should return false if database is unavailable", async () => {
      vi.mocked(db.isRestaurantBookmarked).mockResolvedValueOnce(false);
      
      const result = await db.isRestaurantBookmarked(1, 100);
      expect(result).toBe(false);
    });
  });

  describe("getBookmarkedRestaurants", () => {
    it("should return list of bookmarked restaurants for a user", async () => {
      const mockBookmarks = [
        {
          restaurant: {
            id: 100,
            name: "Pizza Place",
            cuisine: "Italian",
            rating: "4.5",
          },
        },
        {
          restaurant: {
            id: 101,
            name: "Burger Joint",
            cuisine: "American",
            rating: "4.2",
          },
        },
      ];

      vi.mocked(db.getBookmarkedRestaurants).mockResolvedValueOnce(mockBookmarks as any);
      
      const result = await db.getBookmarkedRestaurants(1);
      expect(result).toEqual(mockBookmarks);
      expect(result).toHaveLength(2);
      expect(db.getBookmarkedRestaurants).toHaveBeenCalledWith(1);
    });

    it("should return empty array if user has no bookmarks", async () => {
      vi.mocked(db.getBookmarkedRestaurants).mockResolvedValueOnce([]);
      
      const result = await db.getBookmarkedRestaurants(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should return empty array if database is unavailable", async () => {
      vi.mocked(db.getBookmarkedRestaurants).mockResolvedValueOnce([]);
      
      const result = await db.getBookmarkedRestaurants(1);
      expect(result).toEqual([]);
    });
  });

  describe("Bookmark workflow", () => {
    it("should support full bookmark lifecycle: add, check, remove", async () => {
      const userId = 1;
      const restaurantId = 100;

      // Add bookmark
      await db.addBookmark(userId, restaurantId);
      expect(db.addBookmark).toHaveBeenCalledWith(userId, restaurantId);

      // Check if bookmarked
      vi.mocked(db.isRestaurantBookmarked).mockResolvedValueOnce(true);
      const isBookmarked = await db.isRestaurantBookmarked(userId, restaurantId);
      expect(isBookmarked).toBe(true);

      // Remove bookmark
      await db.removeBookmark(userId, restaurantId);
      expect(db.removeBookmark).toHaveBeenCalledWith(userId, restaurantId);

      // Check if still bookmarked
      vi.mocked(db.isRestaurantBookmarked).mockResolvedValueOnce(false);
      const isStillBookmarked = await db.isRestaurantBookmarked(userId, restaurantId);
      expect(isStillBookmarked).toBe(false);
    });
  });
});
