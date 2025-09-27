import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function Categories() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const { toast } = useToast();
  const [categories, setCategories] = useState([]); // Fixed: renamed from 'category' to 'categories'
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [filter, setFilter] = useState("");

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await axios.get(
        "http://localhost:3001/api/categories/get"
      );

      // Ensure we set an array - handle different response structures
      const categoryData = response.data;
      if (Array.isArray(categoryData)) {
        setCategories(categoryData);
      } else if (categoryData && Array.isArray(categoryData.data)) {
        setCategories(categoryData.data);
      } else {
        console.warn("Unexpected response structure:", categoryData);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      const response = await axios.post(
        "http://localhost:3001/api/categories/create",
        categoryData
      );
      return response.data;
    },
    onSuccess: () => {
      toast({ title: "Category created successfully" });
      setIsAddOpen(false);
      setNewName("");
      setNewIsActive(true);
      fetchCategories(); // Refresh the list
    },
    onError: (error) => {
      console.error("Create category error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(
        `http://localhost:3001/api/categories/delete/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast({ title: "Category deleted successfully" });
      fetchCategories(); // Refresh the list
    },
    onError: (error) => {
      console.error("Delete category error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const onCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    createCategoryMutation.mutate({
      name: newName.trim(),
      isActive: newIsActive,
    });
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className=" bg-grey-50">
        <Sidebar />
      <div className="ml-14 flex-1">
        <Header
          title="Categories"
          subtitle="Create and manage product categories"
        />
        <main className="p-6">
          <div className="bg-white rounded-lg material-elevation-2 p-6 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-grey-900">
                Create Category
              </h3>
              <Button
                onClick={() => setIsAddOpen(true)}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <span className="material-icons mr-2">add</span>
                Add Category
              </Button>
            </div>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <span className="material-icons mr-2">label</span>
                  New Category
                </DialogTitle>
                <DialogDescription>
                  Enter the category details below.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={onCreate} className="space-y-4">
                <div>
                  <Label className="mb-1 block">Name</Label>
                  <Input
                    placeholder="e.g., Beverages"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cat-active"
                    checked={newIsActive}
                    onCheckedChange={(v) => setNewIsActive(Boolean(v))}
                  />
                  <Label htmlFor="cat-active">Active</Label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddOpen(false);
                      setNewName("");
                      setNewIsActive(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary-500 hover:bg-primary-600"
                    disabled={
                      createCategoryMutation.isPending || !newName.trim()
                    }
                  >
                    {createCategoryMutation.isPending ? (
                      <>
                        <span className="material-icons mr-2 animate-spin">
                          refresh
                        </span>
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="bg-white rounded-lg material-elevation-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-grey-900">
                All Categories ({categories.length})
              </h3>
              <div className="w-64">
                <Input
                  placeholder="Search categories..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </div>

            {isLoadingCategories ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <div
                      key={cat.id || cat._id} // Handle both id and _id
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-icons text-grey-500">
                          label
                        </span>
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-xs text-grey-500">
                            {cat.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            deleteCategoryMutation.mutate(cat.id || cat._id)
                          }
                          disabled={deleteCategoryMutation.isPending}
                          className="hover:bg-red-50 hover:border-red-300"
                        >
                          <span className="material-icons text-red-600 text-sm">
                            delete
                          </span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-grey-500 py-8">
                    {filter
                      ? "No categories match your search"
                      : "No categories yet"}
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
