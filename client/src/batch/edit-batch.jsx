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

export default function EditBatchDialog({
  open,
  onOpenChange,
  productId,
  batch,
}) {
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      type: "",
      quantity: "",
      category: "",
      weight: "",
      isActive: true,
      rprice: "",
      wprice: "",
      batchID: "",
    },
  });

  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedFile, setSelectedFile] = useState("");
  const [productData, setProductData] = useState(null);

  // Separate effect for fetching categories and types
  useEffect(() => {
    if (!open) return; // Only fetch when dialog is open

    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await axios.get(
          "http://localhost:3001/api/categories/get"
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
        const response = await axios.get(
          "http://localhost:3001/api/types/get"
        );

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

    fetchCategories();
    fetchTypes();
  }, [open, toast]);

  // Separate effect for fetching product data
  useEffect(() => {
    if (!open || !productId) return;

    const fetchProduct = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await axios.get(
          `http://localhost:3001/api/batch/${batch}/products/${productId}`
        );

        const fetchedProductData =
          response?.data?.data || response?.data?.product || response?.data;

        if (
          fetchedProductData &&
          typeof fetchedProductData === "object" &&
          !Array.isArray(fetchedProductData)
        ) {
          console.log(fetchedProductData);
          setProductData(fetchedProductData);
          setSelectedFile(fetchedProductData.name || "");
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

    fetchProduct();
  }, [open, productId, batch, toast]);

  // Effect to populate form when both product data and categories/types are loaded
  useEffect(() => {
    if (
      productData &&
      !isLoadingCategories &&
      !isLoadingTypes &&
      categories.length > 0 &&
      types.length > 0
    ) {
      // Reset form with product data after categories and types are loaded
      form.reset({
        name: productData.name || "",
        description: productData.description || "",
        rprice: (productData.rprice || 0).toString(),
        wprice: (productData.wprice || 0).toString(),
        weight: (productData.weight || 0).toString(),
        quantity: productData.quantity || 0,
        category: productData.category,
        type: productData.type,
        isActive: productData.isActive ?? true,
        batchID: productData.batchID || "",
      });
    }
  }, [
    productData,
    isLoadingCategories,
    isLoadingTypes,
    categories,
    types,
    form,
  ]);

  // Reset form and state when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setProductData(null);
      setSelectedFile("");
      setCategories([]);
      setTypes([]);
      setIsLoadingCategories(true);
      setIsLoadingTypes(true);
      setIsLoadingProducts(true);
    }
  }, [open, form]);

  console.log(products);

  const updateProductMutation = useMutation({
    mutationFn: async (data) => {
      console.log(data.quantity);
      // Create FormData to send file along with other data
      const formData = new FormData();
      // Append all form fields
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("type", data.type);
      formData.append("weight", data.weight);
      formData.append("isActive", data.isActive);
      formData.append("quantity", data.quantity);
      formData.append("batchID", data.batchID);
      formData.append("wprice", data.wprice);
      formData.append("rprice", data.rprice);
      console.log(data.quantity);

      // Send full FormData object to backend, NOT formData.quantity
      const response = await axios.put(
        `http://localhost:3001/api/batch/${batch}/products/update/${productId}`,
        { quantity: data.quantity },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/batch/products"] });
      toast({
        title: "Product updated",
        description: "Product has been successfully updated.",
      });
      onOpenChange(false);
      // Trigger a page refresh to get the updated data
      window.location.reload();
    },
    onError: (error) => {
      console.error("Add product error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data) => {
    updateProductMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="material-icons mr-2">edit</span>
            Update Stock
          </DialogTitle>
          <DialogDescription>
            Update the stock for this {selectedFile}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
                        {...field}
                        disabled
                      />
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
                        {...field}
                        disabled
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
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rprice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retail Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        disabled
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
                name="wprice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wholesale Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Types *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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
                              {type.name || products.type}
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
                name="quantity"
                rules={{ required: "Quantity is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                name="batchID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter Batch(2025sep01, 2025sep02)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value || "")}
                        sx={{ gridColumn: "span 4" }}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image Upload Section */}

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
                    Updating Stock...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">save</span>
                    Update Changes
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
