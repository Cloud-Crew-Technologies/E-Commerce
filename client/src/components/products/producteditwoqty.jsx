import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function EditProductDialog({ open, onOpenChange, productId }) {
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      productID: "",
      description: "",
      type: "",
      category: "",
      weight: "",
      isActive: true,
      rprice: "",
      wprice: "",
      benefits: "",
      expiryDate: "",
      tax: 0,
      taxValue: 0,
      MRP: 0,
      lowstock: 0,
    },
  });

  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await axios.get(
          "https://saiapi.skillhiveinnovations.com/api/categories/get"
        );

        if (
          response.data &&
          response.data.success &&
          Array.isArray(response.data.data)
        ) {
          setCategories(response.data.data);
        } else if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    const fetchTypes = async () => {
      try {
        setIsLoadingTypes(true);
        const response = await axios.get("https://saiapi.skillhiveinnovations.com/api/types/get");

        if (
          response.data &&
          response.data.success &&
          Array.isArray(response.data.data)
        ) {
          setTypes(response.data.data);
        } else if (Array.isArray(response.data)) {
          setTypes(response.data);
        } else {
          setTypes([]);
        }
      } catch (error) {
        console.error("Failed to fetch types:", error);
        setTypes([]);
        toast({
          title: "Error",
          description: "Failed to load types. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTypes(false);
      }
    };

    const fetchProduct = async () => {
      if (!productId) return;

      try {
        setIsLoadingProducts(true);
        const response = await axios.get(
          `https://saiapi.skillhiveinnovations.com/api/products/get/${productId}`
        );

        if (response.data && response.data.data) {
          const productData = response.data.data;
          console.log(productData);
          setProducts(productData);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast({
          title: "Error",
          description:
            "Failed to load product details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchCategories();
    fetchProduct();
    fetchTypes();
  }, [productId, toast]);

  // Reset form when product data and categories/types are loaded
  useEffect(() => {
    if (
      products &&
      !isLoadingCategories &&
      !isLoadingTypes &&
      !isLoadingProducts
    ) {
      const productData = products;

      console.log("Setting form data:", {
        category: productData.category,
        type: productData.type,
        tax: productData.tax,
        availableCategories: categories.map((c) => c.name),
        availableTypes: types.map((t) => t.name),
      });

      // Update form with product data
      setTimeout(() => {
        form.reset({
          name: productData.name || "",
          productID: productData.productID || "",
          description: productData.description || "",
          rprice: (productData.rprice || 0).toString(),
          wprice: (productData.wprice || 0).toString(),
          weight: (productData.weight || 0).toString(),
          category: productData.category || "",
          type: productData.type || "",
          isActive: productData.isActive ?? true,
          benefits: productData.benefits || "",
          expiryDate: productData.expiryDate || "",
          tax: productData.tax ? productData.tax.toString() : "0",
          taxValue: productData.taxValue || 0,
          MRP: productData.MRP || 0,
          lowstock: productData.lowstock || 0,
        });
      }, 100);

      // Set existing image if available
      if (productData.imageUrl) {
        setImagePreview(productData.imageUrl);
        setSelectedFile(null); // Clear selected file when showing existing image
      }
    }
  }, [
    products,
    isLoadingCategories,
    isLoadingTypes,
    isLoadingProducts,
    form,
    categories,
    types,
  ]);

  // Handle file selection
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

  const updateProductMutation = useMutation({
    mutationFn: async (data) => {
      // Debug logging removed for performance

      // ALWAYS use FormData when updating products (even without image)
      const formData = new FormData();
      const salesvalue = data.tax / 100;
      // Append all form fields
      formData.append("name", data.name || "");
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("type", data.type);
      formData.append("weight", data.weight);
      formData.append("isActive", data.isActive);
      formData.append("wprice", data.wprice);
      formData.append("rprice", data.rprice);
      formData.append("expiryDate", data.expiryDate);
      formData.append("benefits", data.benefits);
      formData.append("tax", data.tax);
      formData.append("MRP", data.MRP);
      formData.append("lowstock", data.lowstock);
      formData.append("wsalesprice", data.wprice / (1 + salesvalue));
      formData.append("rsalesprice", data.rprice / (1 + salesvalue));

      // Calculate taxValue properly
      const rpriceNum = parseFloat(data.rprice) || 0;
      const taxNum = parseFloat(data.tax) || 0;
      const taxValue = (taxNum / 100) * rpriceNum;
      formData.append("taxValue", taxValue.toString());

      // Append image if selected
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      // Send FormData to backend
      const response = await axios.put(
        `https://saiapi.skillhiveinnovations.com/api/products/updatewithimage/${productId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated",
        description: "Product has been successfully updated.",
      });

      // Reset the file selection state
      setSelectedFile(null);

      // Update image preview with new image URL if returned
      if (data.data && data.data.imageUrl) {
        setImagePreview(data.data.imageUrl);
      }
      window.location.reload();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Edit product error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to edit product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    console.log("Form submission data:", data);
    console.log("Selected file:", selectedFile);
    updateProductMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setSelectedFile(null);
    // Reset image preview to original product image
    if (products && products.imageUrl) {
      setImagePreview(products.imageUrl);
    } else {
      setImagePreview(null);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="material-icons mr-2">edit</span>
            Edit Product
          </DialogTitle>
          <DialogDescription>
            Edit the product details. Update any field as needed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Product name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Weight (e.g., 100g, 150g)"
                        type="number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefits</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter benefits description..."
                      className="min-h-[80px]"
                      value={field.value}
                      onChange={(e) => {
                        let value = e.target.value;

                        // If the field is empty and user starts typing, add initial bullet
                        if (!field.value && value && !value.startsWith("* ")) {
                          value = "* " + value;
                        }

                        field.onChange(value);
                      }}
                      onFocus={(e) => {
                        // Add initial bullet point if field is empty when focused
                        if (!field.value) {
                          field.onChange("* ");
                          // Set cursor position after the bullet
                          setTimeout(() => {
                            e.target.setSelectionRange(2, 2);
                          }, 0);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const bullet = "* ";
                          const { selectionStart, selectionEnd, value } =
                            e.target;
                          const newValue =
                            value.slice(0, selectionStart) +
                            "\n" +
                            bullet +
                            value.slice(selectionEnd);

                          // Update using RHF's onChange
                          field.onChange(newValue);

                          // Move cursor after the new bullet point
                          setTimeout(() => {
                            e.target.setSelectionRange(
                              selectionStart + bullet.length + 1,
                              selectionStart + bullet.length + 1
                            );
                          }, 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="lowstock"
                rules={{ required: "low stock is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="MRP"
                rules={{ required: "MRP is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRP *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rprice"
                rules={{ required: "Retail price is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retail Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wprice"
                rules={{ required: "Wholesale price is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wholesale Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                rules={{ required: "Type is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Types *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={isLoadingTypes}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder="Select type"
                            className={
                              field.value ? "" : "text-muted-foreground"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingTypes ? (
                          <SelectItem value="loading" disabled>
                            Loading types...
                          </SelectItem>
                        ) : types && types.length > 0 ? (
                          types.map((type) => (
                            <SelectItem
                              key={type._id || type.id || type.name}
                              value={type.name}
                            >
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-types" disabled>
                            No types available - Please add types first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={isLoadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder="Select category"
                            className={
                              field.value ? "" : "text-muted-foreground"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingCategories ? (
                          <SelectItem value="loading" disabled>
                            Loading categories...
                          </SelectItem>
                        ) : categories && categories.length > 0 ? (
                          categories.map((cat) => (
                            <SelectItem
                              key={cat._id || cat.id || cat.name}
                              value={cat.name}
                            >
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-categories" disabled>
                            No categories available - Please add categories
                            first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax"
                rules={{ required: "Tax rate is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder="Select tax rate"
                            className={
                              field.value ? "" : "text-muted-foreground"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                        <SelectItem value="40">40%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <FormLabel>Product Image</FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mb-2"
                />

                {imagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-40 w-full object-cover rounded"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setImagePreview(products?.image || null);
                        }}
                      >
                        {selectedFile ? "Cancel Selection" : "Remove Image"}
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
                    <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateProductMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600"
                disabled={updateProductMutation.isPending}
              >
                {updateProductMutation.isPending ? (
                  <>
                    <span className="material-icons mr-2 animate-spin">
                      refresh
                    </span>
                    Updating Product...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">save</span>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
