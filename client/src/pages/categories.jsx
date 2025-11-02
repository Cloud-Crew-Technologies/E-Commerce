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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function Categories() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newName, setNewName] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [editSelectedFile, setEditSelectedFile] = useState("");
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await axios.get(
        "https://saiapi.skillhiveinnovations.com/api/categories/get"
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
      console.log(categoryData);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', categoryData.name);
      formData.append('isActive', categoryData.isActive);
      formData.append('image', categoryData.image); // This matches the multer field name
      
      const response = await axios.post(
        "https://saiapi.skillhiveinnovations.com/api/categories/createwithimage",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({ title: "Category created successfully" });
      setIsAddOpen(false);
      setNewName("");
      setNewIsActive(true);
      fetchCategories(); // Refresh the list
      setSelectedFile(null);
      setImagePreview(null);
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

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, categoryData }) => {
      console.log("Updating category:", id, categoryData);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', categoryData.name);
      formData.append('isActive', categoryData.isActive);
      if (categoryData.image) {
        formData.append('image', categoryData.image);
      }
      
      const response = await axios.put(
        `https://saiapi.skillhiveinnovations.com/api/categories/updatewithimage/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast({ title: "Category updated successfully" });
      setIsEditOpen(false);
      setEditingCategory(null);
      setEditName("");
      setEditIsActive(true);
      fetchCategories(); // Refresh the list
      setEditSelectedFile(null);
      setEditImagePreview(null);
    },
    onError: (error) => {
      console.error("Update category error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(
        `https://saiapi.skillhiveinnovations.com/api/categories/delete/${id}`
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
    console.log(selectedFile);

    createCategoryMutation.mutate({
      name: newName.trim(),
      isActive: newIsActive,
      image: selectedFile,
    });
  };

  const onUpdate = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    updateCategoryMutation.mutate({
      id: editingCategory.id || editingCategory._id,
      categoryData: {
        name: editName.trim(),
        isActive: editIsActive,
        image: editSelectedFile,
      },
    });
  };

  const handleEditFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setEditSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditIsActive(category.isActive);
    setEditSelectedFile(null);
    setEditImagePreview(null);
    setIsEditOpen(true);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(filter.toLowerCase())
  );
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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
                {/* Image Upload Section */}
                <div className="space-y-2">
                  <label>Category Image *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="mb-2"
                      required
                    />

                    {imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-40 w-full object-cover rounded"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Selected: {selectedFile?.name}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              setImagePreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="material-icons text-gray-400 text-4xl mb-2">
                          cloud_upload
                        </span>
                        <p className="text-sm text-gray-600">
                          Select an image file to upload
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
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

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <span className="material-icons mr-2">edit</span>
                  Edit Category
                </DialogTitle>
                <DialogDescription>
                  Update the category details below.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={onUpdate} className="space-y-4">
                <div>
                  <Label className="mb-1 block">Name</Label>
                  <Input
                    placeholder="e.g., Beverages"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                {/* Image Upload Section */}
                <div className="space-y-2">
                  <label>Category Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileSelect}
                      className="mb-2"
                    />

                    {editImagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          className="max-h-40 w-full object-cover rounded"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Selected: {editSelectedFile?.name}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditSelectedFile(null);
                              setEditImagePreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : editingCategory?.imageURL ? (
                      <div className="space-y-2">
                        <img
                          src={editingCategory.imageURL}
                          alt="Current"
                          className="max-h-40 w-full object-cover rounded"
                        />
                        <p className="text-sm text-gray-600">
                          Current image (select new image to replace)
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="material-icons text-gray-400 text-4xl mb-2">
                          cloud_upload
                        </span>
                        <p className="text-sm text-gray-600">
                          Select an image file to upload
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-cat-active"
                    checked={editIsActive}
                    onCheckedChange={(v) => setEditIsActive(Boolean(v))}
                  />
                  <Label htmlFor="edit-cat-active">Active</Label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditingCategory(null);
                      setEditName("");
                      setEditIsActive(true);
                      setEditSelectedFile(null);
                      setEditImagePreview(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary-500 hover:bg-primary-600"
                    disabled={
                      updateCategoryMutation.isPending || !editName.trim()
                    }
                  >
                    {updateCategoryMutation.isPending ? (
                      <>
                        <span className="material-icons mr-2 animate-spin">
                          refresh
                        </span>
                        Updating...
                      </>
                    ) : (
                      "Update"
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
                        {cat.imageURL ? (
                          <img
                            src={cat.imageURL}
                            alt={cat.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <span className="material-icons text-grey-500">
                            label
                          </span>
                        )}
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
                          onClick={() => openEditDialog(cat)}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <span className="material-icons text-blue-600 text-sm">
                            edit
                          </span>
                        </Button>
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
