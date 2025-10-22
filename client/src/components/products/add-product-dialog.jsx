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
import { getUOMUnits, convertWeight, convertVolume, isWeightUnit, isVolumeUnit } from "@/lib/weightUtils";

export default function AddProductDialog({ open, onOpenChange }) {
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      productID: "",
      description: "",
      type: "",
      quantity: "",
      category: "",
      weight: "",
      weightUnit: "kg",
      isActive: true,
      rprice: "",
      wprice: "",
      expiryDate: "",
      benefits: "",
      tax: 0,
      taxValue: 0,
      MRP: 0,
      lowstock: 0,
      wsalesprice: 0,
      rsalesprice: 0,
    },
  });

  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // UOM units for weight and volume
  const uomUnits = getUOMUnits();

  // Function to convert weight/volume to base units for storage
  const convertToBaseUnit = (value, unit) => {
    if (isWeightUnit(unit)) {
      return convertWeight(parseFloat(value) || 0, unit, 'kg');
    } else if (isVolumeUnit(unit)) {
      return convertVolume(parseFloat(value) || 0, unit, 'l');
    }
    return value; // Return as-is for unknown units
  };

  // Function to get base unit for storage
  const getBaseUnit = (unit) => {
    if (isWeightUnit(unit)) {
      return 'kg';
    } else if (isVolumeUnit(unit)) {
      return 'l';
    }
    return unit; // Return as-is for unknown units
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await axios.get(
          "https://shisecommerce.skillhiveinnovations.com/api/categories/get"
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
        const response = await axios.get("https://shisecommerce.skillhiveinnovations.com/api/types/get");

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
  }, [toast]);

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

  const addProductMutation = useMutation({
    mutationFn: async (data) => {
      const salesvalue = data.tax / 100;
      // Create FormData to send file along with other data
      const formData = new FormData(); // Generate a random ID for ProductId
      // Append all form fields
      formData.append("name", data.name);
      formData.append(
        "productID",
        data.name + data.category + data.type + Date.now()
      );
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("type", data.type);
      // Convert weight/volume to base units for storage
      const baseUnitValue = convertToBaseUnit(data.weight, data.weightUnit);
      const baseUnit = getBaseUnit(data.weightUnit);
      
      formData.append("weight", data.weight+" "+data.weightUnit);
      formData.append("weightUnit", baseUnit);
      formData.append("weightValue", baseUnitValue.toString());
      formData.append("isActive", data.isActive);
      formData.append("wprice", data.wprice);
      formData.append("rprice", data.rprice);
      formData.append("expiryDate", data.expiryDate);
      formData.append("benefits", data.benefits);
      formData.append("tax", data.tax);

      // Calculate taxValue properly
      const rpriceNum = parseFloat(data.rprice) || 0;
      const taxNum = parseFloat(data.tax) || 0;
      const taxValue = (taxNum / 100) * rpriceNum;
      formData.append("taxValue", taxValue.toString());

      formData.append("MRP", data.MRP);
      formData.append("lowstock", data.lowstock);
      formData.append("wsalesprice", data.wprice / (1 + salesvalue));
      formData.append("rsalesprice", data.rprice / (1 + salesvalue));

      // Append image file if selected
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      // Send FormData to backend
      const response = await axios.post(
        "https://shisecommerce.skillhiveinnovations.com/api/products/create",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product added",
        description: "Product has been successfully added.",
      });
      form.reset();
      setSelectedFile(null);
      setImagePreview(null);
      onOpenChange(false);
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
    onSettled: () => {
      window.location.reload();
    },
  });

  const onSubmit = (data) => {
    addProductMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setSelectedFile(null);
    setImagePreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="material-icons mr-2">add_box</span>
            Add New Product
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new product. The image will be processed
            by the server.
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

              <div className="space-y-2">
                <FormLabel>Weight/Volume(unit) *</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="weight"
                    rules={{ required: "Weight/Volume is required" }}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Enter value"
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weightUnit"
                    rules={{ required: "Unit is required" }}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {uomUnits.map((unit) => (
                                <SelectItem
                                  key={unit.value}
                                  value={unit.value}
                                >
                                  {unit.label} ({unit.fullLabel})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
                rules={{ required: "Wholesale price is required" }}
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="tax"
                rules={{ required: "Tax rate is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Tax rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                        <SelectItem value="4">40%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                rules={{ 
                  validate: (value) => value !== undefined || "Product status is required"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Status *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "true")} 
                      value={field.value !== undefined ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                            placeholder="Select product status"
                            className={
                              field.value !== undefined ? "" : "text-muted-foreground"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <FormLabel>Product Image *</FormLabel>
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
                disabled={addProductMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600"
                disabled={addProductMutation.isPending}
              >
                {addProductMutation.isPending ? (
                  <>
                    <span className="material-icons mr-2 animate-spin">
                      refresh
                    </span>
                    Adding Product...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">add</span>
                    Add Product
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
